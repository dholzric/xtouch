#!/usr/bin/env python3
"""
Hot Reload Development Environment for xtouch
Watches for file changes and automatically triggers rebuilds, tests, and deployments
"""

import os
import sys
import time
import json
import logging
import subprocess
import threading
from pathlib import Path
from typing import Dict, List, Set, Callable, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import asyncio
import websockets
import signal

# Configuration
CONFIG = {
    "workspace": "/workspace",
    "build_delay": 2.0,  # Delay after file change before building
    "websocket_port": 8765,
    "max_build_time": 300,  # 5 minutes
    "watch_patterns": {
        "firmware": ["src/**/*.cpp", "src/**/*.c", "src/**/*.h", "platformio.ini"],
        "web_demo": ["simulation/web_demo/src/**/*.js", "simulation/web_demo/src/**/*.css", "simulation/web_demo/*.html"],
        "lvgl_sim": ["simulation/lvgl_pc/src/**/*.cpp", "simulation/lvgl_pc/src/**/*.c", "simulation/lvgl_pc/CMakeLists.txt"],
        "audio_sim": ["simulation/audio_desktop/src/**/*.cpp", "simulation/audio_desktop/include/**/*.h", "simulation/audio_desktop/CMakeLists.txt"],
        "tests": ["simulation/test_scenarios/**/*.py"],
        "docs": ["docs/**/*.md", "*.md"]
    },
    "build_commands": {
        "firmware": ["pio", "run"],
        "web_demo": ["npm", "run", "build"],
        "lvgl_sim": ["make", "-C", "simulation/lvgl_pc/build"],
        "audio_sim": ["make", "-C", "simulation/audio_desktop/build"],
        "tests": ["python", "-m", "pytest", "simulation/test_scenarios/"],
        "docs": ["mkdocs", "build"]
    },
    "test_commands": {
        "firmware": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "wokwi"],
        "web_demo": ["npm", "test"],
        "lvgl_sim": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "lvgl"],
        "audio_sim": ["python", "simulation/test_scenarios/test_framework.py", "--simulators", "audio"],
    }
}

class BuildManager:
    """Manages build processes and queuing"""
    
    def __init__(self):
        self.build_queue = asyncio.Queue()
        self.current_builds = {}
        self.build_history = []
        self.logger = logging.getLogger("BuildManager")
        
    async def add_build(self, component: str, files_changed: Set[str]):
        """Add a build task to the queue"""
        build_task = {
            "component": component,
            "files_changed": list(files_changed),
            "timestamp": time.time(),
            "id": f"{component}_{int(time.time())}"
        }
        
        # Cancel any pending builds for the same component
        if component in self.current_builds:
            self.current_builds[component].cancel()
            self.logger.info(f"Cancelled pending build for {component}")
        
        await self.build_queue.put(build_task)
        self.logger.info(f"Queued build for {component}: {len(files_changed)} files changed")
    
    async def process_builds(self):
        """Process builds from the queue"""
        while True:
            try:
                build_task = await self.build_queue.get()
                await self._execute_build(build_task)
                self.build_queue.task_done()
            except Exception as e:
                self.logger.error(f"Build processing error: {e}")
    
    async def _execute_build(self, build_task: Dict):
        """Execute a single build task"""
        component = build_task["component"]
        build_id = build_task["id"]
        
        self.logger.info(f"Starting build {build_id}")
        
        start_time = time.time()
        build_result = {
            "id": build_id,
            "component": component,
            "start_time": start_time,
            "files_changed": build_task["files_changed"],
            "status": "running"
        }
        
        self.current_builds[component] = asyncio.current_task()
        
        try:
            # Execute build command
            if component in CONFIG["build_commands"]:
                cmd = CONFIG["build_commands"][component]
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    cwd=CONFIG["workspace"],
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.STDOUT
                )
                
                # Wait for build to complete with timeout
                try:
                    stdout, _ = await asyncio.wait_for(
                        process.communicate(),
                        timeout=CONFIG["max_build_time"]
                    )
                    
                    build_result["output"] = stdout.decode('utf-8', errors='ignore')
                    build_result["return_code"] = process.returncode
                    
                    if process.returncode == 0:
                        build_result["status"] = "success"
                        self.logger.info(f"Build {build_id} completed successfully")
                        
                        # Run tests if build succeeded
                        await self._run_tests(component, build_result)
                    else:
                        build_result["status"] = "failed"
                        self.logger.error(f"Build {build_id} failed with code {process.returncode}")
                        
                except asyncio.TimeoutError:
                    process.kill()
                    build_result["status"] = "timeout"
                    build_result["error"] = f"Build timed out after {CONFIG['max_build_time']} seconds"
                    self.logger.error(f"Build {build_id} timed out")
                    
            else:
                build_result["status"] = "skipped"
                build_result["error"] = f"No build command configured for {component}"
                
        except Exception as e:
            build_result["status"] = "error"
            build_result["error"] = str(e)
            self.logger.error(f"Build {build_id} error: {e}")
        
        finally:
            build_result["end_time"] = time.time()
            build_result["duration"] = build_result["end_time"] - start_time
            
            self.build_history.append(build_result)
            if len(self.build_history) > 100:  # Keep only last 100 builds
                self.build_history.pop(0)
            
            if component in self.current_builds:
                del self.current_builds[component]
            
            # Notify clients about build completion
            await NotificationManager.notify_build_complete(build_result)
    
    async def _run_tests(self, component: str, build_result: Dict):
        """Run tests after successful build"""
        if component not in CONFIG["test_commands"]:
            return
        
        self.logger.info(f"Running tests for {component}")
        
        try:
            cmd = CONFIG["test_commands"][component]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=CONFIG["workspace"],
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
            )
            
            stdout, _ = await asyncio.wait_for(
                process.communicate(),
                timeout=120  # 2 minute timeout for tests
            )
            
            build_result["test_output"] = stdout.decode('utf-8', errors='ignore')
            build_result["test_return_code"] = process.returncode
            build_result["tests_passed"] = process.returncode == 0
            
            if process.returncode == 0:
                self.logger.info(f"Tests passed for {component}")
            else:
                self.logger.warning(f"Tests failed for {component}")
                
        except asyncio.TimeoutError:
            build_result["test_output"] = "Tests timed out"
            build_result["tests_passed"] = False
            self.logger.error(f"Tests timed out for {component}")
        except Exception as e:
            build_result["test_output"] = f"Test execution error: {e}"
            build_result["tests_passed"] = False
            self.logger.error(f"Test execution error for {component}: {e}")

class FileWatcher(FileSystemEventHandler):
    """Watches for file system changes"""
    
    def __init__(self, build_manager: BuildManager):
        self.build_manager = build_manager
        self.pending_changes = {}  # component -> set of files
        self.debounce_timers = {}  # component -> timer
        self.logger = logging.getLogger("FileWatcher")
    
    def on_any_event(self, event):
        """Handle any file system event"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        relative_path = file_path.relative_to(CONFIG["workspace"])
        
        # Determine which component this file belongs to
        component = self._get_component_for_file(relative_path)
        if not component:
            return
        
        # Ignore certain files
        if self._should_ignore_file(relative_path):
            return
        
        self.logger.debug(f"File change detected: {relative_path} -> {component}")
        
        # Add to pending changes
        if component not in self.pending_changes:
            self.pending_changes[component] = set()
        
        self.pending_changes[component].add(str(relative_path))
        
        # Reset debounce timer
        if component in self.debounce_timers:
            self.debounce_timers[component].cancel()
        
        self.debounce_timers[component] = threading.Timer(
            CONFIG["build_delay"],
            self._trigger_build,
            args=[component]
        )
        self.debounce_timers[component].start()
    
    def _get_component_for_file(self, file_path: Path) -> Optional[str]:
        """Determine which component a file belongs to"""
        path_str = str(file_path)
        
        # Check each component's watch patterns
        for component, patterns in CONFIG["watch_patterns"].items():
            for pattern in patterns:
                if self._matches_pattern(path_str, pattern):
                    return component
        
        return None
    
    def _matches_pattern(self, file_path: str, pattern: str) -> bool:
        """Check if file path matches a glob pattern"""
        import fnmatch
        return fnmatch.fnmatch(file_path, pattern)
    
    def _should_ignore_file(self, file_path: Path) -> bool:
        """Check if file should be ignored"""
        ignore_patterns = [
            "**/.git/**",
            "**/__pycache__/**",
            "**/*.pyc",
            "**/node_modules/**",
            "**/build/**",
            "**/.pio/**",
            "**/.cache/**",
            "**/test_results_*.json",
            "**/*.log"
        ]
        
        path_str = str(file_path)
        for pattern in ignore_patterns:
            if self._matches_pattern(path_str, pattern):
                return True
        
        return False
    
    def _trigger_build(self, component: str):
        """Trigger a build for the component"""
        if component in self.pending_changes:
            files_changed = self.pending_changes[component].copy()
            self.pending_changes[component].clear()
            
            # Add build to queue asynchronously
            asyncio.create_task(
                self.build_manager.add_build(component, files_changed)
            )

class NotificationManager:
    """Manages notifications to connected clients"""
    
    connected_clients = set()
    
    @classmethod
    async def register_client(cls, websocket):
        """Register a new client"""
        cls.connected_clients.add(websocket)
        
        # Send current status
        await cls.send_to_client(websocket, {
            "type": "status",
            "message": "Connected to hot reload server"
        })
    
    @classmethod
    async def unregister_client(cls, websocket):
        """Unregister a client"""
        cls.connected_clients.discard(websocket)
    
    @classmethod
    async def notify_build_complete(cls, build_result: Dict):
        """Notify all clients about build completion"""
        message = {
            "type": "build_complete",
            "component": build_result["component"],
            "status": build_result["status"],
            "duration": build_result["duration"],
            "files_changed": build_result.get("files_changed", []),
            "tests_passed": build_result.get("tests_passed"),
            "timestamp": build_result["end_time"]
        }
        
        await cls.broadcast(message)
    
    @classmethod
    async def notify_file_change(cls, component: str, files: List[str]):
        """Notify clients about file changes"""
        message = {
            "type": "file_change",
            "component": component,
            "files": files,
            "timestamp": time.time()
        }
        
        await cls.broadcast(message)
    
    @classmethod
    async def broadcast(cls, message: Dict):
        """Broadcast message to all connected clients"""
        if not cls.connected_clients:
            return
        
        message_json = json.dumps(message)
        disconnected_clients = set()
        
        for client in cls.connected_clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                logging.error(f"Error sending message to client: {e}")
                disconnected_clients.add(client)
        
        # Remove disconnected clients
        cls.connected_clients -= disconnected_clients
    
    @classmethod
    async def send_to_client(cls, client, message: Dict):
        """Send message to specific client"""
        try:
            await client.send(json.dumps(message))
        except Exception as e:
            logging.error(f"Error sending message to client: {e}")

class WebSocketServer:
    """WebSocket server for client communication"""
    
    def __init__(self, build_manager: BuildManager):
        self.build_manager = build_manager
        self.logger = logging.getLogger("WebSocketServer")
    
    async def handle_client(self, websocket, path):
        """Handle WebSocket client connection"""
        await NotificationManager.register_client(websocket)
        self.logger.info(f"Client connected: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self._handle_message(websocket, json.loads(message))
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            self.logger.error(f"Client error: {e}")
        finally:
            await NotificationManager.unregister_client(websocket)
            self.logger.info(f"Client disconnected: {websocket.remote_address}")
    
    async def _handle_message(self, websocket, message: Dict):
        """Handle message from client"""
        msg_type = message.get("type")
        
        if msg_type == "get_status":
            status = {
                "type": "status_response",
                "current_builds": list(self.build_manager.current_builds.keys()),
                "build_queue_size": self.build_manager.build_queue.qsize(),
                "build_history": self.build_manager.build_history[-10:],  # Last 10 builds
                "connected_clients": len(NotificationManager.connected_clients)
            }
            await NotificationManager.send_to_client(websocket, status)
        
        elif msg_type == "trigger_build":
            component = message.get("component")
            if component and component in CONFIG["build_commands"]:
                await self.build_manager.add_build(component, set())
                await NotificationManager.send_to_client(websocket, {
                    "type": "build_triggered",
                    "component": component
                })
        
        elif msg_type == "get_build_history":
            await NotificationManager.send_to_client(websocket, {
                "type": "build_history",
                "history": self.build_manager.build_history
            })

class HotReloadServer:
    """Main hot reload server"""
    
    def __init__(self):
        self.build_manager = BuildManager()
        self.file_watcher = FileWatcher(self.build_manager)
        self.websocket_server = WebSocketServer(self.build_manager)
        self.observer = Observer()
        self.logger = logging.getLogger("HotReloadServer")
        
        # Set up graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        self.shutdown_event = asyncio.Event()
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, shutting down...")
        asyncio.create_task(self._shutdown())
    
    async def _shutdown(self):
        """Graceful shutdown"""
        self.shutdown_event.set()
    
    async def start(self):
        """Start the hot reload server"""
        self.logger.info("Starting hot reload server...")
        
        # Start file watcher
        self.observer.schedule(
            self.file_watcher,
            CONFIG["workspace"],
            recursive=True
        )
        self.observer.start()
        self.logger.info("File watcher started")
        
        # Start build manager
        build_task = asyncio.create_task(self.build_manager.process_builds())
        
        # Start WebSocket server
        websocket_server = websockets.serve(
            self.websocket_server.handle_client,
            "0.0.0.0",
            CONFIG["websocket_port"]
        )
        await websocket_server
        self.logger.info(f"WebSocket server started on port {CONFIG['websocket_port']}")
        
        # Wait for shutdown
        await self.shutdown_event.wait()
        
        # Cleanup
        self.logger.info("Shutting down...")
        self.observer.stop()
        self.observer.join()
        build_task.cancel()
        
        try:
            await build_task
        except asyncio.CancelledError:
            pass
        
        self.logger.info("Hot reload server stopped")

def setup_logging():
    """Set up logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/workspace/hot_reload.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )

async def main():
    """Main entry point"""
    setup_logging()
    
    # Load configuration from environment
    if os.getenv("WORKSPACE"):
        CONFIG["workspace"] = os.getenv("WORKSPACE")
    
    if os.getenv("WEBSOCKET_PORT"):
        CONFIG["websocket_port"] = int(os.getenv("WEBSOCKET_PORT"))
    
    if os.getenv("BUILD_DELAY"):
        CONFIG["build_delay"] = float(os.getenv("BUILD_DELAY"))
    
    # Create hot reload server
    server = HotReloadServer()
    
    try:
        await server.start()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        logging.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())