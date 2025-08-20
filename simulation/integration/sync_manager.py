#!/usr/bin/env python3
"""
Integration and Synchronization Manager for xtouch Simulation Environment
Connects simulations to the existing xtouch codebase and manages synchronization
"""

import os
import sys
import time
import json
import logging
import subprocess
import threading
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
import asyncio
import aiohttp
from aiohttp import web
import yaml
import hashlib

@dataclass
class SyncConfig:
    """Synchronization configuration"""
    source_path: str
    target_path: str
    patterns: List[str]
    exclude_patterns: List[str]
    bidirectional: bool = False
    auto_sync: bool = True
    conflict_resolution: str = "newer"  # newer, source, target, manual

@dataclass
class SyncEvent:
    """Synchronization event"""
    timestamp: float
    event_type: str  # file_changed, sync_started, sync_completed, conflict
    source_path: str
    target_path: str
    file_hash: Optional[str] = None
    conflict_reason: Optional[str] = None
    resolution: Optional[str] = None

class FileSynchronizer:
    """Handles file synchronization between different components"""
    
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.sync_configs = []
        self.file_hashes = {}
        self.sync_events = []
        self.logger = logging.getLogger("FileSynchronizer")
        
        # Load default sync configurations
        self._load_default_configs()
    
    def _load_default_configs(self):
        """Load default synchronization configurations"""
        configs = [
            # UI components sync
            SyncConfig(
                source_path="src/ui",
                target_path="simulation/lvgl_pc/src/ui",
                patterns=["*.c", "*.h"],
                exclude_patterns=["**/build/**", "**/.git/**"],
                bidirectional=True,
                auto_sync=True
            ),
            
            # Audio components sync
            SyncConfig(
                source_path="src/xtouch",
                target_path="simulation/audio_desktop/src/xtouch_compat",
                patterns=["*.h", "*.c", "*.cpp"],
                exclude_patterns=["**/wifi*", "**/mqtt*", "**/net*"],
                bidirectional=False,  # One-way to simulation
                auto_sync=True
            ),
            
            # Configuration sync
            SyncConfig(
                source_path="resources",
                target_path="simulation/lvgl_pc/resources",
                patterns=["*.h", "*.json"],
                exclude_patterns=["**/*.tmp"],
                bidirectional=False,
                auto_sync=True
            ),
            
            # Test data sync
            SyncConfig(
                source_path="simulation/test_scenarios/test_data",
                target_path="simulation/web_demo/assets/test_data",
                patterns=["*.wav", "*.mp3", "*.json"],
                exclude_patterns=["**/*.log"],
                bidirectional=False,
                auto_sync=True
            ),
            
            # Documentation sync
            SyncConfig(
                source_path="docs",
                target_path="simulation/web_demo/src/docs",
                patterns=["*.md"],
                exclude_patterns=["**/build/**"],
                bidirectional=False,
                auto_sync=True
            )
        ]
        
        self.sync_configs.extend(configs)
    
    def add_sync_config(self, config: SyncConfig):
        """Add a new sync configuration"""
        self.sync_configs.append(config)
        self.logger.info(f"Added sync config: {config.source_path} -> {config.target_path}")
    
    def sync_all(self, force: bool = False) -> List[SyncEvent]:
        """Synchronize all configured paths"""
        all_events = []
        
        for config in self.sync_configs:
            if config.auto_sync or force:
                events = self.sync_paths(config)
                all_events.extend(events)
        
        return all_events
    
    def sync_paths(self, config: SyncConfig) -> List[SyncEvent]:
        """Synchronize files between source and target paths"""
        events = []
        source_path = self.workspace_root / config.source_path
        target_path = self.workspace_root / config.target_path
        
        if not source_path.exists():
            self.logger.warning(f"Source path does not exist: {source_path}")
            return events
        
        # Create target directory if it doesn't exist
        target_path.mkdir(parents=True, exist_ok=True)
        
        # Find files to sync
        source_files = self._find_files(source_path, config.patterns, config.exclude_patterns)
        
        for source_file in source_files:
            relative_path = source_file.relative_to(source_path)
            target_file = target_path / relative_path
            
            sync_event = self._sync_file(source_file, target_file, config)
            if sync_event:
                events.append(sync_event)
                self.sync_events.append(sync_event)
        
        # Handle bidirectional sync
        if config.bidirectional:
            target_files = self._find_files(target_path, config.patterns, config.exclude_patterns)
            
            for target_file in target_files:
                relative_path = target_file.relative_to(target_path)
                source_file = source_path / relative_path
                
                if not source_file.exists():
                    sync_event = self._sync_file(target_file, source_file, config)
                    if sync_event:
                        events.append(sync_event)
                        self.sync_events.append(sync_event)
        
        # Cleanup old events (keep last 1000)
        if len(self.sync_events) > 1000:
            self.sync_events = self.sync_events[-500:]
        
        return events
    
    def _find_files(self, path: Path, patterns: List[str], exclude_patterns: List[str]) -> List[Path]:
        """Find files matching patterns"""
        import fnmatch
        
        files = []
        
        for pattern in patterns:
            if pattern.startswith("**/"):
                # Recursive pattern
                for file_path in path.rglob(pattern[3:]):
                    if file_path.is_file():
                        files.append(file_path)
            else:
                # Non-recursive pattern
                for file_path in path.glob(pattern):
                    if file_path.is_file():
                        files.append(file_path)
        
        # Filter out excluded patterns
        filtered_files = []
        for file_path in files:
            exclude = False
            for exclude_pattern in exclude_patterns:
                if fnmatch.fnmatch(str(file_path), exclude_pattern):
                    exclude = True
                    break
            
            if not exclude:
                filtered_files.append(file_path)
        
        return filtered_files
    
    def _sync_file(self, source_file: Path, target_file: Path, config: SyncConfig) -> Optional[SyncEvent]:
        """Synchronize a single file"""
        try:
            # Calculate file hash
            source_hash = self._calculate_file_hash(source_file)
            
            # Check if target exists and has different content
            if target_file.exists():
                target_hash = self._calculate_file_hash(target_file)
                
                if source_hash == target_hash:
                    # Files are identical, no sync needed
                    return None
                
                # Handle conflict resolution
                if config.conflict_resolution == "newer":
                    source_mtime = source_file.stat().st_mtime
                    target_mtime = target_file.stat().st_mtime
                    
                    if target_mtime > source_mtime:
                        # Target is newer, don't overwrite
                        return SyncEvent(
                            timestamp=time.time(),
                            event_type="conflict",
                            source_path=str(source_file),
                            target_path=str(target_file),
                            file_hash=source_hash,
                            conflict_reason="target_newer",
                            resolution="skipped"
                        )
                
                elif config.conflict_resolution == "target":
                    # Keep target, don't overwrite
                    return None
            
            # Create target directory if needed
            target_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy file
            shutil.copy2(source_file, target_file)
            
            # Update hash cache
            self.file_hashes[str(target_file)] = source_hash
            
            self.logger.debug(f"Synced: {source_file} -> {target_file}")
            
            return SyncEvent(
                timestamp=time.time(),
                event_type="file_synced",
                source_path=str(source_file),
                target_path=str(target_file),
                file_hash=source_hash
            )
            
        except Exception as e:
            self.logger.error(f"Error syncing {source_file} -> {target_file}: {e}")
            return SyncEvent(
                timestamp=time.time(),
                event_type="sync_error",
                source_path=str(source_file),
                target_path=str(target_file),
                conflict_reason=str(e)
            )
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        hasher = hashlib.sha256()
        
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            self.logger.error(f"Error calculating hash for {file_path}: {e}")
            return ""
    
    def get_sync_events(self, limit: int = 100) -> List[SyncEvent]:
        """Get recent sync events"""
        return self.sync_events[-limit:]

class ComponentIntegrator:
    """Integrates different simulation components with the main codebase"""
    
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.components = {}
        self.integration_configs = {}
        self.logger = logging.getLogger("ComponentIntegrator")
        
        # Load integration configurations
        self._load_integration_configs()
    
    def _load_integration_configs(self):
        """Load component integration configurations"""
        configs = {
            "wokwi": {
                "type": "hardware_simulation",
                "build_command": ["pio", "run"],
                "test_command": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "wokwi"],
                "dependencies": ["platformio.ini", "src/**/*.cpp", "src/**/*.h"],
                "outputs": [".pio/build/esp32dev/firmware.bin", ".pio/build/esp32dev/firmware.elf"],
                "integration_points": {
                    "firmware_sync": {
                        "source": ".pio/build/esp32dev/firmware.bin",
                        "targets": ["simulation/wokwi/firmware.bin"]
                    }
                }
            },
            
            "lvgl_pc": {
                "type": "ui_simulation",
                "build_command": ["make", "-C", "simulation/lvgl_pc/build"],
                "test_command": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "lvgl"],
                "dependencies": ["src/ui/**/*", "resources/lv_conf.h"],
                "outputs": ["simulation/lvgl_pc/build/xtouch_lvgl_simulator"],
                "integration_points": {
                    "ui_sync": {
                        "source": "src/ui",
                        "targets": ["simulation/lvgl_pc/src/ui"]
                    },
                    "config_sync": {
                        "source": "resources/lv_conf.h",
                        "targets": ["simulation/lvgl_pc/lv_conf.h"]
                    }
                }
            },
            
            "audio_desktop": {
                "type": "audio_simulation",
                "build_command": ["make", "-C", "simulation/audio_desktop/build"],
                "test_command": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "audio"],
                "dependencies": ["src/xtouch/**/*.h", "simulation/audio_desktop/src/**/*"],
                "outputs": ["simulation/audio_desktop/build/xtouch_audio_simulator"],
                "integration_points": {
                    "header_sync": {
                        "source": "src/xtouch",
                        "targets": ["simulation/audio_desktop/include/xtouch"]
                    }
                }
            },
            
            "web_demo": {
                "type": "web_simulation",
                "build_command": ["npm", "run", "build"],
                "test_command": ["npm", "test"],
                "dependencies": ["simulation/web_demo/src/**/*", "simulation/web_demo/package.json"],
                "outputs": ["simulation/web_demo/dist"],
                "integration_points": {
                    "asset_sync": {
                        "source": "readme-assets",
                        "targets": ["simulation/web_demo/assets"]
                    }
                }
            }
        }
        
        self.integration_configs.update(configs)
    
    def register_component(self, name: str, config: Dict[str, Any]):
        """Register a new component for integration"""
        self.components[name] = {
            "config": config,
            "status": "registered",
            "last_build": None,
            "last_sync": None
        }
        
        self.logger.info(f"Registered component: {name}")
    
    def integrate_component(self, component_name: str) -> Dict[str, Any]:
        """Integrate a specific component with the main codebase"""
        if component_name not in self.integration_configs:
            return {"error": f"Unknown component: {component_name}"}
        
        config = self.integration_configs[component_name]
        result = {
            "component": component_name,
            "type": config["type"],
            "integration_steps": [],
            "success": True
        }
        
        try:
            # Step 1: Sync dependencies
            self.logger.info(f"Integrating component: {component_name}")
            
            for point_name, point_config in config.get("integration_points", {}).items():
                sync_result = self._sync_integration_point(point_name, point_config)
                result["integration_steps"].append({
                    "step": f"sync_{point_name}",
                    "success": sync_result["success"],
                    "details": sync_result
                })
                
                if not sync_result["success"]:
                    result["success"] = False
            
            # Step 2: Build component
            build_result = self._build_component(component_name, config)
            result["integration_steps"].append({
                "step": "build",
                "success": build_result["success"],
                "details": build_result
            })
            
            if not build_result["success"]:
                result["success"] = False
            
            # Step 3: Run tests
            test_result = self._test_component(component_name, config)
            result["integration_steps"].append({
                "step": "test",
                "success": test_result["success"],
                "details": test_result
            })
            
            if not test_result["success"]:
                result["success"] = False
            
            # Update component status
            if component_name in self.components:
                self.components[component_name]["status"] = "integrated" if result["success"] else "failed"
                self.components[component_name]["last_build"] = time.time()
            
            self.logger.info(f"Component {component_name} integration {'succeeded' if result['success'] else 'failed'}")
            
        except Exception as e:
            self.logger.error(f"Error integrating component {component_name}: {e}")
            result["success"] = False
            result["error"] = str(e)
        
        return result
    
    def _sync_integration_point(self, point_name: str, point_config: Dict[str, Any]) -> Dict[str, Any]:
        """Sync files for an integration point"""
        source_path = self.workspace_root / point_config["source"]
        targets = point_config["targets"]
        
        result = {
            "success": True,
            "synced_files": 0,
            "errors": []
        }
        
        if not source_path.exists():
            result["success"] = False
            result["errors"].append(f"Source path does not exist: {source_path}")
            return result
        
        for target in targets:
            target_path = self.workspace_root / target
            
            try:
                if source_path.is_file():
                    # Single file sync
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source_path, target_path)
                    result["synced_files"] += 1
                else:
                    # Directory sync
                    target_path.mkdir(parents=True, exist_ok=True)
                    
                    for source_file in source_path.rglob("*"):
                        if source_file.is_file():
                            relative_path = source_file.relative_to(source_path)
                            target_file = target_path / relative_path
                            target_file.parent.mkdir(parents=True, exist_ok=True)
                            shutil.copy2(source_file, target_file)
                            result["synced_files"] += 1
                
            except Exception as e:
                result["success"] = False
                result["errors"].append(f"Error syncing to {target}: {e}")
        
        return result
    
    def _build_component(self, component_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Build a component"""
        build_command = config.get("build_command", [])
        
        if not build_command:
            return {"success": True, "message": "No build command specified"}
        
        try:
            self.logger.info(f"Building {component_name}: {' '.join(build_command)}")
            
            result = subprocess.run(
                build_command,
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            return {
                "success": result.returncode == 0,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": build_command
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Build timed out after 5 minutes",
                "command": build_command
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": build_command
            }
    
    def _test_component(self, component_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test a component"""
        test_command = config.get("test_command", [])
        
        if not test_command:
            return {"success": True, "message": "No test command specified"}
        
        try:
            self.logger.info(f"Testing {component_name}: {' '.join(test_command)}")
            
            result = subprocess.run(
                test_command,
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=180  # 3 minute timeout
            )
            
            return {
                "success": result.returncode == 0,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": test_command
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Tests timed out after 3 minutes",
                "command": test_command
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": test_command
            }
    
    def integrate_all_components(self) -> Dict[str, Any]:
        """Integrate all registered components"""
        results = {}
        overall_success = True
        
        for component_name in self.integration_configs.keys():
            result = self.integrate_component(component_name)
            results[component_name] = result
            
            if not result["success"]:
                overall_success = False
        
        return {
            "overall_success": overall_success,
            "component_results": results,
            "timestamp": time.time()
        }
    
    def get_component_status(self, component_name: Optional[str] = None) -> Dict[str, Any]:
        """Get status of components"""
        if component_name:
            return self.components.get(component_name, {"error": "Component not found"})
        else:
            return self.components.copy()

class DependencyManager:
    """Manages dependencies between simulation components and main codebase"""
    
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.dependency_graph = {}
        self.change_listeners = {}
        self.logger = logging.getLogger("DependencyManager")
        
        # Build dependency graph
        self._build_dependency_graph()
    
    def _build_dependency_graph(self):
        """Build dependency graph between components"""
        dependencies = {
            "firmware": {
                "depends_on": [],
                "dependents": ["wokwi", "hardware_tests"],
                "files": ["src/**/*.cpp", "src/**/*.h", "platformio.ini"]
            },
            
            "ui_components": {
                "depends_on": ["firmware"],
                "dependents": ["lvgl_pc", "web_demo"],
                "files": ["src/ui/**/*", "resources/lv_conf.h"]
            },
            
            "audio_components": {
                "depends_on": ["firmware"],
                "dependents": ["audio_desktop", "web_demo"],
                "files": ["src/xtouch/**/*.h", "simulation/audio_desktop/**/*"]
            },
            
            "wokwi": {
                "depends_on": ["firmware"],
                "dependents": [],
                "files": ["simulation/wokwi/**/*"]
            },
            
            "lvgl_pc": {
                "depends_on": ["ui_components"],
                "dependents": [],
                "files": ["simulation/lvgl_pc/**/*"]
            },
            
            "audio_desktop": {
                "depends_on": ["audio_components"],
                "dependents": [],
                "files": ["simulation/audio_desktop/**/*"]
            },
            
            "web_demo": {
                "depends_on": ["ui_components", "audio_components"],
                "dependents": [],
                "files": ["simulation/web_demo/**/*"]
            }
        }
        
        self.dependency_graph = dependencies
    
    def add_dependency(self, component: str, depends_on: str):
        """Add a dependency relationship"""
        if component not in self.dependency_graph:
            self.dependency_graph[component] = {"depends_on": [], "dependents": [], "files": []}
        
        if depends_on not in self.dependency_graph[component]["depends_on"]:
            self.dependency_graph[component]["depends_on"].append(depends_on)
        
        if depends_on not in self.dependency_graph:
            self.dependency_graph[depends_on] = {"depends_on": [], "dependents": [], "files": []}
        
        if component not in self.dependency_graph[depends_on]["dependents"]:
            self.dependency_graph[depends_on]["dependents"].append(component)
        
        self.logger.info(f"Added dependency: {component} depends on {depends_on}")
    
    def get_dependents(self, component: str) -> List[str]:
        """Get components that depend on the specified component"""
        return self.dependency_graph.get(component, {}).get("dependents", [])
    
    def get_dependencies(self, component: str) -> List[str]:
        """Get components that the specified component depends on"""
        return self.dependency_graph.get(component, {}).get("depends_on", [])
    
    def get_build_order(self) -> List[str]:
        """Get optimal build order based on dependencies"""
        # Topological sort
        visited = set()
        temp_visited = set()
        result = []
        
        def visit(component):
            if component in temp_visited:
                raise ValueError(f"Circular dependency detected involving {component}")
            
            if component not in visited:
                temp_visited.add(component)
                
                for dependency in self.get_dependencies(component):
                    visit(dependency)
                
                temp_visited.remove(component)
                visited.add(component)
                result.append(component)
        
        for component in self.dependency_graph.keys():
            if component not in visited:
                visit(component)
        
        return result
    
    def propagate_changes(self, changed_component: str) -> List[str]:
        """Get list of components that need to be rebuilt due to changes"""
        affected_components = []
        
        def collect_dependents(component):
            dependents = self.get_dependents(component)
            for dependent in dependents:
                if dependent not in affected_components:
                    affected_components.append(dependent)
                    collect_dependents(dependent)
        
        collect_dependents(changed_component)
        return affected_components
    
    def validate_dependencies(self) -> Dict[str, Any]:
        """Validate dependency graph for issues"""
        issues = {
            "circular_dependencies": [],
            "missing_dependencies": [],
            "orphaned_components": []
        }
        
        # Check for circular dependencies
        try:
            self.get_build_order()
        except ValueError as e:
            issues["circular_dependencies"].append(str(e))
        
        # Check for missing files
        for component, config in self.dependency_graph.items():
            for file_pattern in config.get("files", []):
                file_path = self.workspace_root / file_pattern
                
                # Check if pattern matches any files
                if "*" in file_pattern:
                    matching_files = list(self.workspace_root.glob(file_pattern))
                    if not matching_files:
                        issues["missing_dependencies"].append(f"{component}: No files match {file_pattern}")
                else:
                    if not file_path.exists():
                        issues["missing_dependencies"].append(f"{component}: Missing file {file_pattern}")
        
        # Check for orphaned components (no dependencies or dependents)
        for component, config in self.dependency_graph.items():
            if not config["depends_on"] and not config["dependents"]:
                issues["orphaned_components"].append(component)
        
        return issues

class IntegrationAPI:
    """Web API for integration management"""
    
    def __init__(self, synchronizer: FileSynchronizer, integrator: ComponentIntegrator, 
                 dependency_manager: DependencyManager, port: int = 8092):
        self.synchronizer = synchronizer
        self.integrator = integrator
        self.dependency_manager = dependency_manager
        self.port = port
        self.app = web.Application()
        self.setup_routes()
        self.logger = logging.getLogger("IntegrationAPI")
    
    def setup_routes(self):
        """Setup API routes"""
        # Synchronization endpoints
        self.app.router.add_get('/api/sync/status', self._sync_status_handler)
        self.app.router.add_post('/api/sync/trigger', self._sync_trigger_handler)
        self.app.router.add_get('/api/sync/events', self._sync_events_handler)
        
        # Integration endpoints
        self.app.router.add_get('/api/integration/components', self._components_handler)
        self.app.router.add_post('/api/integration/integrate/{component}', self._integrate_component_handler)
        self.app.router.add_post('/api/integration/integrate-all', self._integrate_all_handler)
        
        # Dependency endpoints
        self.app.router.add_get('/api/dependencies/graph', self._dependency_graph_handler)
        self.app.router.add_get('/api/dependencies/build-order', self._build_order_handler)
        self.app.router.add_post('/api/dependencies/validate', self._validate_dependencies_handler)
        
        # Main dashboard
        self.app.router.add_get('/', self._dashboard_handler)
    
    async def _dashboard_handler(self, request):
        """Serve integration dashboard"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>xtouch Integration Manager</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
        .container { max-width: 1400px; margin: 0 auto; }
        .section { background: #2d2d2d; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .section h3 { color: #007acc; margin-top: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        button { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #005a9e; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #444; }
        th { background: #333; }
        .log { background: #000; border: 1px solid #333; padding: 10px; height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>xtouch Integration Manager</h1>
        
        <div class="grid">
            <div class="section">
                <h3>Synchronization Control</h3>
                <button onclick="triggerSync()">Sync All</button>
                <button onclick="refreshSyncStatus()">Refresh Status</button>
                
                <h4>Sync Status</h4>
                <div id="sync-status">Loading...</div>
                
                <h4>Recent Sync Events</h4>
                <div class="log" id="sync-events"></div>
            </div>
            
            <div class="section">
                <h3>Component Integration</h3>
                <button onclick="integrateAll()">Integrate All</button>
                <button onclick="refreshComponents()">Refresh</button>
                
                <h4>Component Status</h4>
                <table id="component-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="component-tbody">
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="section">
            <h3>Dependency Management</h3>
            <button onclick="validateDependencies()">Validate Dependencies</button>
            <button onclick="showBuildOrder()">Show Build Order</button>
            
            <div class="grid">
                <div>
                    <h4>Dependency Graph</h4>
                    <div class="log" id="dependency-graph"></div>
                </div>
                <div>
                    <h4>Validation Results</h4>
                    <div class="log" id="validation-results"></div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>Integration Log</h3>
            <div class="log" id="integration-log"></div>
        </div>
    </div>
    
    <script>
        async function apiCall(endpoint, method = 'GET', data = null) {
            const options = { method };
            if (data) {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(data);
            }
            
            try {
                const response = await fetch(endpoint, options);
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                return { error: error.message };
            }
        }
        
        function addLogEntry(message, type = 'info') {
            const log = document.getElementById('integration-log');
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.className = `status-${type}`;
            entry.textContent = `[${timestamp}] ${message}`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        async function triggerSync() {
            addLogEntry('Triggering synchronization...', 'info');
            const result = await apiCall('/api/sync/trigger', 'POST');
            
            if (result.error) {
                addLogEntry(`Sync failed: ${result.error}`, 'error');
            } else {
                addLogEntry(`Sync completed: ${result.events_count} events`, 'good');
            }
            
            refreshSyncStatus();
        }
        
        async function refreshSyncStatus() {
            const result = await apiCall('/api/sync/status');
            const container = document.getElementById('sync-status');
            
            if (result.error) {
                container.innerHTML = `<div class="status-error">Error: ${result.error}</div>`;
                return;
            }
            
            let html = '';
            result.configs.forEach(config => {
                html += `<div>${config.source_path} → ${config.target_path}</div>`;
            });
            
            container.innerHTML = html || 'No sync configurations';
            
            // Update sync events
            refreshSyncEvents();
        }
        
        async function refreshSyncEvents() {
            const result = await apiCall('/api/sync/events?limit=20');
            const container = document.getElementById('sync-events');
            
            if (result.error) {
                container.innerHTML = `<div class="status-error">Error: ${result.error}</div>`;
                return;
            }
            
            let html = '';
            result.forEach(event => {
                const timestamp = new Date(event.timestamp * 1000).toLocaleTimeString();
                html += `<div>[${timestamp}] ${event.event_type}: ${event.source_path}</div>`;
            });
            
            container.innerHTML = html || 'No sync events';
        }
        
        async function refreshComponents() {
            const result = await apiCall('/api/integration/components');
            const tbody = document.getElementById('component-tbody');
            
            if (result.error) {
                tbody.innerHTML = `<tr><td colspan="3" class="status-error">Error: ${result.error}</td></tr>`;
                return;
            }
            
            tbody.innerHTML = '';
            
            for (const [name, status] of Object.entries(result)) {
                const row = tbody.insertRow();
                const statusClass = status.status === 'integrated' ? 'status-good' : 
                                   status.status === 'failed' ? 'status-error' : 'status-warning';
                
                row.innerHTML = `
                    <td>${name}</td>
                    <td class="${statusClass}">${status.status || 'unknown'}</td>
                    <td><button onclick="integrateComponent('${name}')">Integrate</button></td>
                `;
            }
        }
        
        async function integrateComponent(componentName) {
            addLogEntry(`Integrating component: ${componentName}`, 'info');
            const result = await apiCall(`/api/integration/integrate/${componentName}`, 'POST');
            
            if (result.error) {
                addLogEntry(`Integration failed: ${result.error}`, 'error');
            } else if (result.success) {
                addLogEntry(`Integration succeeded for ${componentName}`, 'good');
            } else {
                addLogEntry(`Integration failed for ${componentName}`, 'error');
            }
            
            refreshComponents();
        }
        
        async function integrateAll() {
            addLogEntry('Starting full integration...', 'info');
            const result = await apiCall('/api/integration/integrate-all', 'POST');
            
            if (result.error) {
                addLogEntry(`Integration failed: ${result.error}`, 'error');
            } else if (result.overall_success) {
                addLogEntry('All components integrated successfully', 'good');
            } else {
                addLogEntry('Some components failed integration', 'warning');
            }
            
            refreshComponents();
        }
        
        async function validateDependencies() {
            const result = await apiCall('/api/dependencies/validate', 'POST');
            const container = document.getElementById('validation-results');
            
            if (result.error) {
                container.innerHTML = `<div class="status-error">Error: ${result.error}</div>`;
                return;
            }
            
            let html = '';
            
            if (result.circular_dependencies.length > 0) {
                html += '<div class="status-error">Circular Dependencies:</div>';
                result.circular_dependencies.forEach(dep => {
                    html += `<div>  ${dep}</div>`;
                });
            }
            
            if (result.missing_dependencies.length > 0) {
                html += '<div class="status-warning">Missing Dependencies:</div>';
                result.missing_dependencies.forEach(dep => {
                    html += `<div>  ${dep}</div>`;
                });
            }
            
            if (result.orphaned_components.length > 0) {
                html += '<div class="status-warning">Orphaned Components:</div>';
                result.orphaned_components.forEach(comp => {
                    html += `<div>  ${comp}</div>`;
                });
            }
            
            if (!html) {
                html = '<div class="status-good">All dependencies are valid</div>';
            }
            
            container.innerHTML = html;
        }
        
        async function showBuildOrder() {
            const result = await apiCall('/api/dependencies/build-order');
            const container = document.getElementById('dependency-graph');
            
            if (result.error) {
                container.innerHTML = `<div class="status-error">Error: ${result.error}</div>`;
                return;
            }
            
            let html = '<div>Recommended build order:</div>';
            result.forEach((component, index) => {
                html += `<div>${index + 1}. ${component}</div>`;
            });
            
            container.innerHTML = html;
        }
        
        // Initialize dashboard
        refreshSyncStatus();
        refreshComponents();
        showBuildOrder();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            refreshSyncStatus();
            refreshComponents();
        }, 30000);
    </script>
</body>
</html>
        """
        return web.Response(text=html, content_type='text/html')
    
    async def _sync_status_handler(self, request):
        """Get synchronization status"""
        return web.json_response({
            "configs": [asdict(config) for config in self.synchronizer.sync_configs],
            "file_hashes_count": len(self.synchronizer.file_hashes),
            "events_count": len(self.synchronizer.sync_events)
        })
    
    async def _sync_trigger_handler(self, request):
        """Trigger synchronization"""
        try:
            events = self.synchronizer.sync_all(force=True)
            return web.json_response({
                "success": True,
                "events_count": len(events),
                "events": [asdict(event) for event in events[-10:]]  # Last 10 events
            })
        except Exception as e:
            return web.json_response({"error": str(e)})
    
    async def _sync_events_handler(self, request):
        """Get sync events"""
        limit = int(request.query.get('limit', 50))
        events = self.synchronizer.get_sync_events(limit)
        return web.json_response([asdict(event) for event in events])
    
    async def _components_handler(self, request):
        """Get component status"""
        return web.json_response(self.integrator.get_component_status())
    
    async def _integrate_component_handler(self, request):
        """Integrate a specific component"""
        component_name = request.match_info['component']
        result = self.integrator.integrate_component(component_name)
        return web.json_response(result)
    
    async def _integrate_all_handler(self, request):
        """Integrate all components"""
        result = self.integrator.integrate_all_components()
        return web.json_response(result)
    
    async def _dependency_graph_handler(self, request):
        """Get dependency graph"""
        return web.json_response(self.dependency_manager.dependency_graph)
    
    async def _build_order_handler(self, request):
        """Get recommended build order"""
        try:
            build_order = self.dependency_manager.get_build_order()
            return web.json_response(build_order)
        except Exception as e:
            return web.json_response({"error": str(e)})
    
    async def _validate_dependencies_handler(self, request):
        """Validate dependencies"""
        validation_result = self.dependency_manager.validate_dependencies()
        return web.json_response(validation_result)
    
    async def start_server(self):
        """Start the integration API server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        self.logger.info(f"Integration API started on http://localhost:{self.port}")

async def main():
    """Main entry point for integration manager"""
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('integration_manager.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    workspace_root = os.getenv('WORKSPACE', '/workspace')
    
    # Create integration components
    synchronizer = FileSynchronizer(workspace_root)
    integrator = ComponentIntegrator(workspace_root)
    dependency_manager = DependencyManager(workspace_root)
    api = IntegrationAPI(synchronizer, integrator, dependency_manager)
    
    # Start API server
    await api.start_server()
    
    logger = logging.getLogger("IntegrationManager")
    logger.info("Integration manager started")
    logger.info("Dashboard available at http://localhost:8092")
    
    # Perform initial synchronization and integration
    logger.info("Performing initial synchronization...")
    sync_events = synchronizer.sync_all()
    logger.info(f"Initial sync completed: {len(sync_events)} events")
    
    # Validate dependencies
    validation_result = dependency_manager.validate_dependencies()
    if any(validation_result.values()):
        logger.warning("Dependency validation issues found")
        for issue_type, issues in validation_result.items():
            if issues:
                logger.warning(f"{issue_type}: {issues}")
    
    try:
        # Main loop
        while True:
            await asyncio.sleep(60)  # Run sync every minute
            
            # Periodic sync
            sync_events = synchronizer.sync_all()
            if sync_events:
                logger.info(f"Periodic sync: {len(sync_events)} events")
    
    except KeyboardInterrupt:
        logger.info("Integration manager shutting down...")

if __name__ == "__main__":
    asyncio.run(main())