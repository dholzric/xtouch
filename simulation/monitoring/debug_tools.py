#!/usr/bin/env python3
"""
Advanced Debugging Tools for xtouch Simulation Environment
"""

import os
import sys
import time
import json
import logging
import threading
import subprocess
import traceback
import inspect
import dis
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from contextlib import contextmanager
import functools
import cProfile
import pstats
import io
import gc
import weakref

@dataclass
class DebugEvent:
    """Debug event data structure"""
    timestamp: float
    event_type: str
    source_file: str
    line_number: int
    function_name: str
    locals_vars: Dict[str, Any]
    stack_trace: List[str]
    thread_id: int
    process_id: int

@dataclass
class PerformanceProfile:
    """Performance profiling results"""
    function_name: str
    total_time: float
    cumulative_time: float
    call_count: int
    per_call_time: float
    filename: str
    line_number: int

class AdvancedDebugger:
    """Advanced debugging capabilities with breakpoints, tracing, and analysis"""
    
    def __init__(self):
        self.breakpoints = {}  # file:line -> condition
        self.watchpoints = {}  # variable_name -> condition
        self.trace_enabled = False
        self.debug_events = []
        self.call_stack = []
        self.local_variables = {}
        self.logger = logging.getLogger("AdvancedDebugger")
        
        # Performance profiling
        self.profiler = None
        self.profile_data = {}
        
        # Memory debugging
        self.memory_snapshots = []
        self.object_references = weakref.WeakSet()
        
    def set_breakpoint(self, filename: str, line_number: int, condition: Optional[str] = None):
        """Set a breakpoint with optional condition"""
        key = f"{filename}:{line_number}"
        self.breakpoints[key] = condition
        self.logger.info(f"Breakpoint set at {key}" + (f" with condition: {condition}" if condition else ""))
    
    def remove_breakpoint(self, filename: str, line_number: int):
        """Remove a breakpoint"""
        key = f"{filename}:{line_number}"
        if key in self.breakpoints:
            del self.breakpoints[key]
            self.logger.info(f"Breakpoint removed from {key}")
    
    def set_watchpoint(self, variable_name: str, condition: Optional[str] = None):
        """Set a watchpoint on a variable"""
        self.watchpoints[variable_name] = condition
        self.logger.info(f"Watchpoint set on {variable_name}" + (f" with condition: {condition}" if condition else ""))
    
    def start_tracing(self):
        """Start execution tracing"""
        import sys
        sys.settrace(self._trace_calls)
        self.trace_enabled = True
        self.logger.info("Execution tracing started")
    
    def stop_tracing(self):
        """Stop execution tracing"""
        import sys
        sys.settrace(None)
        self.trace_enabled = False
        self.logger.info("Execution tracing stopped")
    
    def _trace_calls(self, frame, event, arg):
        """Trace function calls and line execution"""
        filename = frame.f_code.co_filename
        line_number = frame.f_lineno
        function_name = frame.f_code.co_name
        
        # Only trace our project files
        if not ('xtouch' in filename or 'simulation' in filename):
            return self._trace_calls
        
        # Check breakpoints
        breakpoint_key = f"{filename}:{line_number}"
        if breakpoint_key in self.breakpoints:
            condition = self.breakpoints[breakpoint_key]
            if condition is None or self._evaluate_condition(condition, frame.f_locals):
                self._handle_breakpoint(frame, event, arg)
        
        # Check watchpoints
        for var_name, condition in self.watchpoints.items():
            if var_name in frame.f_locals:
                if condition is None or self._evaluate_condition(condition, frame.f_locals):
                    self._handle_watchpoint(var_name, frame.f_locals[var_name], frame)
        
        # Record debug event
        if event in ['call', 'line', 'return', 'exception']:
            debug_event = DebugEvent(
                timestamp=time.time(),
                event_type=event,
                source_file=filename,
                line_number=line_number,
                function_name=function_name,
                locals_vars=self._safe_locals_copy(frame.f_locals),
                stack_trace=self._get_stack_trace(),
                thread_id=threading.get_ident(),
                process_id=os.getpid()
            )
            self.debug_events.append(debug_event)
            
            # Keep only recent events
            if len(self.debug_events) > 1000:
                self.debug_events = self.debug_events[-500:]
        
        return self._trace_calls
    
    def _evaluate_condition(self, condition: str, local_vars: Dict) -> bool:
        """Safely evaluate a breakpoint/watchpoint condition"""
        try:
            # Create a safe environment for evaluation
            safe_globals = {"__builtins__": {}}
            safe_locals = local_vars.copy()
            return eval(condition, safe_globals, safe_locals)
        except Exception as e:
            self.logger.warning(f"Error evaluating condition '{condition}': {e}")
            return False
    
    def _handle_breakpoint(self, frame, event, arg):
        """Handle breakpoint hit"""
        filename = frame.f_code.co_filename
        line_number = frame.f_lineno
        function_name = frame.f_code.co_name
        
        self.logger.info(f"BREAKPOINT HIT: {filename}:{line_number} in {function_name}()")
        
        # Print local variables
        for name, value in frame.f_locals.items():
            self.logger.info(f"  {name} = {repr(value)}")
        
        # Interactive debugging could be implemented here
        # For now, we'll just log and continue
    
    def _handle_watchpoint(self, var_name: str, value: Any, frame):
        """Handle watchpoint trigger"""
        filename = frame.f_code.co_filename
        line_number = frame.f_lineno
        
        self.logger.info(f"WATCHPOINT: {var_name} = {repr(value)} at {filename}:{line_number}")
    
    def _safe_locals_copy(self, locals_dict: Dict) -> Dict[str, Any]:
        """Create a safe copy of local variables"""
        safe_copy = {}
        for name, value in locals_dict.items():
            try:
                # Only include serializable values
                if isinstance(value, (str, int, float, bool, list, dict, tuple)):
                    safe_copy[name] = value
                else:
                    safe_copy[name] = f"<{type(value).__name__}>"
            except Exception:
                safe_copy[name] = "<unrepresentable>"
        return safe_copy
    
    def _get_stack_trace(self) -> List[str]:
        """Get current stack trace"""
        return [line.strip() for line in traceback.format_stack()]
    
    def get_debug_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[DebugEvent]:
        """Get recent debug events"""
        events = self.debug_events
        
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        return events[-limit:]
    
    def analyze_call_patterns(self) -> Dict[str, Any]:
        """Analyze function call patterns"""
        function_calls = {}
        call_sequences = []
        
        for event in self.debug_events:
            if event.event_type == 'call':
                func_key = f"{event.source_file}:{event.function_name}"
                if func_key not in function_calls:
                    function_calls[func_key] = {
                        "count": 0,
                        "first_call": event.timestamp,
                        "last_call": event.timestamp
                    }
                
                function_calls[func_key]["count"] += 1
                function_calls[func_key]["last_call"] = event.timestamp
                
                call_sequences.append(func_key)
        
        # Find common call patterns
        pattern_analysis = self._analyze_sequences(call_sequences)
        
        return {
            "function_calls": function_calls,
            "call_patterns": pattern_analysis,
            "total_events": len(self.debug_events)
        }
    
    def _analyze_sequences(self, sequences: List[str], window_size: int = 3) -> Dict[str, int]:
        """Analyze call sequence patterns"""
        patterns = {}
        
        for i in range(len(sequences) - window_size + 1):
            pattern = tuple(sequences[i:i + window_size])
            pattern_key = " -> ".join(pattern)
            patterns[pattern_key] = patterns.get(pattern_key, 0) + 1
        
        # Return top patterns
        return dict(sorted(patterns.items(), key=lambda x: x[1], reverse=True)[:20])

class PerformanceProfiler:
    """Advanced performance profiling tools"""
    
    def __init__(self):
        self.active_profiles = {}
        self.profile_results = {}
        self.timing_data = {}
        self.logger = logging.getLogger("PerformanceProfiler")
    
    @contextmanager
    def profile_function(self, function_name: str):
        """Context manager for profiling a function"""
        profiler = cProfile.Profile()
        start_time = time.time()
        
        profiler.enable()
        try:
            yield profiler
        finally:
            profiler.disable()
            end_time = time.time()
            
            # Store timing data
            self.timing_data[function_name] = {
                "start_time": start_time,
                "end_time": end_time,
                "duration": end_time - start_time
            }
            
            # Process profile results
            self._process_profile_results(function_name, profiler)
    
    def _process_profile_results(self, function_name: str, profiler):
        """Process and store profile results"""
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s)
        ps.sort_stats('cumulative')
        
        # Get top functions
        results = []
        for func_info, (cc, nc, tt, ct, callers) in ps.stats.items():
            filename, line_number, func_name = func_info
            
            results.append(PerformanceProfile(
                function_name=func_name,
                total_time=tt,
                cumulative_time=ct,
                call_count=cc,
                per_call_time=tt / cc if cc > 0 else 0,
                filename=filename,
                line_number=line_number
            ))
        
        # Sort by cumulative time
        results.sort(key=lambda x: x.cumulative_time, reverse=True)
        
        self.profile_results[function_name] = {
            "profiles": results[:20],  # Top 20 functions
            "total_time": self.timing_data[function_name]["duration"],
            "timestamp": time.time()
        }
        
        self.logger.info(f"Profile completed for {function_name}: {self.timing_data[function_name]['duration']:.3f}s")
    
    def profile_decorator(self, function_name: Optional[str] = None):
        """Decorator for automatic function profiling"""
        def decorator(func):
            nonlocal function_name
            if function_name is None:
                function_name = f"{func.__module__}.{func.__name__}"
            
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                with self.profile_function(function_name):
                    return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def get_profile_results(self, function_name: str) -> Optional[Dict[str, Any]]:
        """Get profile results for a function"""
        return self.profile_results.get(function_name)
    
    def get_all_profiles(self) -> Dict[str, Any]:
        """Get all profile results"""
        return self.profile_results.copy()
    
    def compare_profiles(self, function_name: str, baseline_timestamp: float) -> Dict[str, Any]:
        """Compare current profile with baseline"""
        if function_name not in self.profile_results:
            return {"error": "No profile data available"}
        
        current_profile = self.profile_results[function_name]
        
        # Find baseline profile
        baseline_profile = None
        for name, profile in self.profile_results.items():
            if name == function_name and profile["timestamp"] <= baseline_timestamp:
                baseline_profile = profile
                break
        
        if not baseline_profile:
            return {"error": "No baseline profile found"}
        
        # Compare results
        comparison = {
            "current_time": current_profile["total_time"],
            "baseline_time": baseline_profile["total_time"],
            "time_delta": current_profile["total_time"] - baseline_profile["total_time"],
            "time_ratio": current_profile["total_time"] / baseline_profile["total_time"],
            "regression": current_profile["total_time"] > baseline_profile["total_time"] * 1.1
        }
        
        return comparison

class MemoryAnalyzer:
    """Memory usage analysis and leak detection"""
    
    def __init__(self):
        self.snapshots = []
        self.tracked_objects = {}
        self.allocation_trackers = {}
        self.logger = logging.getLogger("MemoryAnalyzer")
        
        # Enable tracemalloc if available
        try:
            import tracemalloc
            tracemalloc.start()
            self.tracemalloc_available = True
            self.logger.info("Memory tracing enabled")
        except ImportError:
            self.tracemalloc_available = False
            self.logger.warning("tracemalloc not available")
    
    def take_snapshot(self, name: str) -> Dict[str, Any]:
        """Take a memory snapshot"""
        snapshot_data = {
            "name": name,
            "timestamp": time.time(),
            "memory_usage": self._get_memory_usage(),
            "object_counts": self._get_object_counts(),
            "gc_stats": self._get_gc_stats()
        }
        
        if self.tracemalloc_available:
            import tracemalloc
            snapshot = tracemalloc.take_snapshot()
            snapshot_data["tracemalloc"] = self._process_tracemalloc_snapshot(snapshot)
        
        self.snapshots.append(snapshot_data)
        self.logger.info(f"Memory snapshot '{name}' taken")
        
        return snapshot_data
    
    def _get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage"""
        import psutil
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "rss_mb": memory_info.rss / (1024 * 1024),
            "vms_mb": memory_info.vms / (1024 * 1024),
            "percent": process.memory_percent(),
            "available_mb": psutil.virtual_memory().available / (1024 * 1024)
        }
    
    def _get_object_counts(self) -> Dict[str, int]:
        """Get object counts by type"""
        object_counts = {}
        
        for obj in gc.get_objects():
            obj_type = type(obj).__name__
            object_counts[obj_type] = object_counts.get(obj_type, 0) + 1
        
        # Return top 20 object types
        return dict(sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:20])
    
    def _get_gc_stats(self) -> Dict[str, Any]:
        """Get garbage collection statistics"""
        return {
            "collections": gc.get_stats(),
            "count": gc.get_count(),
            "threshold": gc.get_threshold()
        }
    
    def _process_tracemalloc_snapshot(self, snapshot) -> Dict[str, Any]:
        """Process tracemalloc snapshot"""
        top_stats = snapshot.statistics('lineno')
        
        memory_stats = []
        for stat in top_stats[:20]:
            memory_stats.append({
                "filename": stat.traceback.format()[-1] if stat.traceback else "unknown",
                "size_mb": stat.size / (1024 * 1024),
                "count": stat.count
            })
        
        return {
            "top_allocations": memory_stats,
            "total_size_mb": sum(stat.size for stat in top_stats) / (1024 * 1024)
        }
    
    def compare_snapshots(self, name1: str, name2: str) -> Dict[str, Any]:
        """Compare two memory snapshots"""
        snapshot1 = next((s for s in self.snapshots if s["name"] == name1), None)
        snapshot2 = next((s for s in self.snapshots if s["name"] == name2), None)
        
        if not snapshot1 or not snapshot2:
            return {"error": "One or both snapshots not found"}
        
        memory1 = snapshot1["memory_usage"]
        memory2 = snapshot2["memory_usage"]
        
        comparison = {
            "memory_delta_mb": memory2["rss_mb"] - memory1["rss_mb"],
            "memory_growth_percent": ((memory2["rss_mb"] / memory1["rss_mb"]) - 1) * 100,
            "object_count_changes": self._compare_object_counts(
                snapshot1["object_counts"], 
                snapshot2["object_counts"]
            ),
            "time_delta": snapshot2["timestamp"] - snapshot1["timestamp"]
        }
        
        # Detect potential memory leaks
        if comparison["memory_delta_mb"] > 10:  # 10MB increase
            comparison["potential_leak"] = True
            comparison["leak_severity"] = "high" if comparison["memory_delta_mb"] > 50 else "medium"
        else:
            comparison["potential_leak"] = False
        
        return comparison
    
    def _compare_object_counts(self, counts1: Dict[str, int], counts2: Dict[str, int]) -> Dict[str, int]:
        """Compare object counts between snapshots"""
        changes = {}
        
        all_types = set(counts1.keys()) | set(counts2.keys())
        
        for obj_type in all_types:
            old_count = counts1.get(obj_type, 0)
            new_count = counts2.get(obj_type, 0)
            delta = new_count - old_count
            
            if delta != 0:
                changes[obj_type] = delta
        
        # Return significant changes
        return {k: v for k, v in changes.items() if abs(v) > 10}
    
    def detect_memory_leaks(self) -> List[Dict[str, Any]]:
        """Detect potential memory leaks"""
        if len(self.snapshots) < 2:
            return []
        
        leaks = []
        
        # Compare consecutive snapshots
        for i in range(1, len(self.snapshots)):
            comparison = self.compare_snapshots(
                self.snapshots[i-1]["name"],
                self.snapshots[i]["name"]
            )
            
            if comparison.get("potential_leak"):
                leaks.append({
                    "from_snapshot": self.snapshots[i-1]["name"],
                    "to_snapshot": self.snapshots[i]["name"],
                    "memory_increase_mb": comparison["memory_delta_mb"],
                    "severity": comparison["leak_severity"],
                    "timestamp": self.snapshots[i]["timestamp"]
                })
        
        return leaks
    
    def track_object_lifecycle(self, obj, name: str):
        """Track an object's lifecycle"""
        obj_id = id(obj)
        self.tracked_objects[obj_id] = {
            "name": name,
            "type": type(obj).__name__,
            "created": time.time(),
            "reference_count": sys.getrefcount(obj)
        }
        
        # Use weak reference to track when object is deleted
        def cleanup_callback(weak_ref):
            if obj_id in self.tracked_objects:
                self.tracked_objects[obj_id]["deleted"] = time.time()
                self.logger.info(f"Tracked object '{name}' was garbage collected")
        
        weakref.ref(obj, cleanup_callback)

class LogAnalyzer:
    """Advanced log analysis and debugging"""
    
    def __init__(self):
        self.log_patterns = {}
        self.error_patterns = {}
        self.performance_patterns = {}
        self.logger = logging.getLogger("LogAnalyzer")
    
    def analyze_log_file(self, log_file_path: str) -> Dict[str, Any]:
        """Analyze a log file for patterns and issues"""
        if not os.path.exists(log_file_path):
            return {"error": f"Log file not found: {log_file_path}"}
        
        analysis = {
            "file_path": log_file_path,
            "file_size_mb": os.path.getsize(log_file_path) / (1024 * 1024),
            "line_count": 0,
            "error_count": 0,
            "warning_count": 0,
            "patterns": {},
            "errors": [],
            "performance_issues": [],
            "timestamps": {"first": None, "last": None}
        }
        
        try:
            with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    analysis["line_count"] = line_num
                    
                    # Extract timestamp
                    timestamp = self._extract_timestamp(line)
                    if timestamp:
                        if analysis["timestamps"]["first"] is None:
                            analysis["timestamps"]["first"] = timestamp
                        analysis["timestamps"]["last"] = timestamp
                    
                    # Count error/warning levels
                    if "ERROR" in line:
                        analysis["error_count"] += 1
                        analysis["errors"].append({
                            "line_number": line_num,
                            "content": line.strip(),
                            "timestamp": timestamp
                        })
                    elif "WARNING" in line or "WARN" in line:
                        analysis["warning_count"] += 1
                    
                    # Detect patterns
                    self._analyze_line_patterns(line, analysis["patterns"])
                    
                    # Detect performance issues
                    perf_issue = self._detect_performance_issue(line, line_num)
                    if perf_issue:
                        analysis["performance_issues"].append(perf_issue)
        
        except Exception as e:
            analysis["error"] = f"Error analyzing log file: {e}"
        
        return analysis
    
    def _extract_timestamp(self, line: str) -> Optional[str]:
        """Extract timestamp from log line"""
        import re
        
        # Common timestamp patterns
        patterns = [
            r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}',
            r'\d{2}:\d{2}:\d{2}',
            r'\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                return match.group()
        
        return None
    
    def _analyze_line_patterns(self, line: str, patterns: Dict[str, int]):
        """Analyze patterns in log lines"""
        # Common patterns to look for
        pattern_checks = {
            "build_started": "Building",
            "build_completed": "completed successfully",
            "build_failed": "failed",
            "test_started": "Running test",
            "test_passed": "PASS",
            "test_failed": "FAIL",
            "memory_usage": "Memory usage",
            "cpu_usage": "CPU usage",
            "connection_error": "connection error",
            "timeout": "timeout",
            "exception": "Exception"
        }
        
        for pattern_name, pattern_text in pattern_checks.items():
            if pattern_text.lower() in line.lower():
                patterns[pattern_name] = patterns.get(pattern_name, 0) + 1
    
    def _detect_performance_issue(self, line: str, line_number: int) -> Optional[Dict[str, Any]]:
        """Detect performance issues in log lines"""
        issues = []
        
        # High CPU usage
        if "cpu usage" in line.lower() and "%" in line:
            import re
            cpu_match = re.search(r'(\d+(?:\.\d+)?)%', line)
            if cpu_match:
                cpu_value = float(cpu_match.group(1))
                if cpu_value > 80:
                    return {
                        "type": "high_cpu",
                        "line_number": line_number,
                        "value": cpu_value,
                        "content": line.strip()
                    }
        
        # High memory usage
        if "memory" in line.lower() and ("mb" in line.lower() or "%" in line):
            import re
            memory_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:mb|%)', line.lower())
            if memory_match:
                memory_value = float(memory_match.group(1))
                if "%" in line and memory_value > 85:
                    return {
                        "type": "high_memory_percent",
                        "line_number": line_number,
                        "value": memory_value,
                        "content": line.strip()
                    }
                elif "mb" in line.lower() and memory_value > 500:
                    return {
                        "type": "high_memory_mb",
                        "line_number": line_number,
                        "value": memory_value,
                        "content": line.strip()
                    }
        
        # Long build times
        if "build" in line.lower() and any(word in line.lower() for word in ["completed", "finished", "took"]):
            import re
            time_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:seconds?|s)', line.lower())
            if time_match:
                time_value = float(time_match.group(1))
                if time_value > 30:
                    return {
                        "type": "slow_build",
                        "line_number": line_number,
                        "value": time_value,
                        "content": line.strip()
                    }
        
        return None
    
    def generate_log_report(self, log_file_path: str) -> str:
        """Generate a comprehensive log analysis report"""
        analysis = self.analyze_log_file(log_file_path)
        
        if "error" in analysis:
            return f"Error analyzing log: {analysis['error']}"
        
        report = []
        report.append("=" * 60)
        report.append("LOG ANALYSIS REPORT")
        report.append("=" * 60)
        report.append(f"File: {analysis['file_path']}")
        report.append(f"Size: {analysis['file_size_mb']:.1f} MB")
        report.append(f"Lines: {analysis['line_count']:,}")
        report.append("")
        
        # Summary
        report.append("SUMMARY")
        report.append("-" * 20)
        report.append(f"Errors: {analysis['error_count']}")
        report.append(f"Warnings: {analysis['warning_count']}")
        report.append(f"Performance Issues: {len(analysis['performance_issues'])}")
        
        if analysis["timestamps"]["first"] and analysis["timestamps"]["last"]:
            report.append(f"Time Range: {analysis['timestamps']['first']} to {analysis['timestamps']['last']}")
        
        report.append("")
        
        # Patterns
        if analysis["patterns"]:
            report.append("PATTERNS DETECTED")
            report.append("-" * 20)
            for pattern, count in sorted(analysis["patterns"].items(), key=lambda x: x[1], reverse=True):
                report.append(f"{pattern}: {count}")
            report.append("")
        
        # Recent errors
        if analysis["errors"]:
            report.append("RECENT ERRORS")
            report.append("-" * 20)
            for error in analysis["errors"][-10:]:  # Last 10 errors
                report.append(f"Line {error['line_number']}: {error['content']}")
            report.append("")
        
        # Performance issues
        if analysis["performance_issues"]:
            report.append("PERFORMANCE ISSUES")
            report.append("-" * 20)
            for issue in analysis["performance_issues"][-10:]:  # Last 10 issues
                report.append(f"Line {issue['line_number']} ({issue['type']}): {issue['value']}")
            report.append("")
        
        return "\n".join(report)

class DebugDashboard:
    """Web-based debugging dashboard"""
    
    def __init__(self, debugger: AdvancedDebugger, profiler: PerformanceProfiler, 
                 memory_analyzer: MemoryAnalyzer, log_analyzer: LogAnalyzer, port: int = 8091):
        self.debugger = debugger
        self.profiler = profiler
        self.memory_analyzer = memory_analyzer
        self.log_analyzer = log_analyzer
        self.port = port
        self.logger = logging.getLogger("DebugDashboard")
    
    async def start_server(self):
        """Start the debug dashboard web server"""
        from aiohttp import web
        
        app = web.Application()
        
        # API routes
        app.router.add_get('/api/debug/events', self._debug_events_handler)
        app.router.add_get('/api/debug/breakpoints', self._breakpoints_handler)
        app.router.add_post('/api/debug/breakpoint', self._set_breakpoint_handler)
        app.router.add_get('/api/profile/results', self._profile_results_handler)
        app.router.add_get('/api/memory/snapshots', self._memory_snapshots_handler)
        app.router.add_post('/api/memory/snapshot', self._take_snapshot_handler)
        app.router.add_get('/api/logs/analyze', self._log_analysis_handler)
        
        # Main dashboard
        app.router.add_get('/', self._dashboard_handler)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        
        self.logger.info(f"Debug dashboard started on http://localhost:{self.port}")
    
    async def _dashboard_handler(self, request):
        """Serve the main dashboard"""
        # Return a comprehensive debugging dashboard HTML
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>xtouch Debug Dashboard</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; margin: 20px; }
        .container { max-width: 1600px; margin: 0 auto; }
        .section { background: #111; border: 1px solid #333; margin: 10px 0; padding: 15px; }
        .section h3 { color: #0ff; margin-top: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        button { background: #333; color: #0f0; border: 1px solid #555; padding: 8px 16px; margin: 5px; cursor: pointer; }
        button:hover { background: #555; }
        .log { background: #000; border: 1px solid #333; padding: 10px; height: 200px; overflow-y: auto; font-size: 12px; }
        .error { color: #f00; }
        .warning { color: #ff0; }
        .info { color: #0f0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #222; }
        input[type="text"] { background: #222; border: 1px solid #555; color: #0f0; padding: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>xtouch Debug Dashboard</h1>
        
        <div class="grid">
            <div class="section">
                <h3>Debugger Control</h3>
                <button onclick="startTracing()">Start Tracing</button>
                <button onclick="stopTracing()">Stop Tracing</button>
                <button onclick="clearEvents()">Clear Events</button>
                
                <h4>Set Breakpoint</h4>
                <input type="text" id="bp-file" placeholder="filename.py" style="width: 200px;">
                <input type="text" id="bp-line" placeholder="line number" style="width: 100px;">
                <input type="text" id="bp-condition" placeholder="condition (optional)" style="width: 200px;">
                <button onclick="setBreakpoint()">Set Breakpoint</button>
                
                <h4>Debug Events</h4>
                <div class="log" id="debug-events"></div>
            </div>
            
            <div class="section">
                <h3>Performance Profiler</h3>
                <button onclick="refreshProfiles()">Refresh</button>
                <button onclick="clearProfiles()">Clear</button>
                
                <h4>Profile Results</h4>
                <div class="log" id="profile-results"></div>
            </div>
        </div>
        
        <div class="grid">
            <div class="section">
                <h3>Memory Analyzer</h3>
                <input type="text" id="snapshot-name" placeholder="snapshot name" style="width: 200px;">
                <button onclick="takeSnapshot()">Take Snapshot</button>
                <button onclick="analyzeLeaks()">Analyze Leaks</button>
                
                <h4>Memory Snapshots</h4>
                <div class="log" id="memory-snapshots"></div>
            </div>
            
            <div class="section">
                <h3>Log Analyzer</h3>
                <input type="text" id="log-file" placeholder="log file path" style="width: 300px;">
                <button onclick="analyzeLogs()">Analyze</button>
                
                <h4>Log Analysis</h4>
                <div class="log" id="log-analysis"></div>
            </div>
        </div>
        
        <div class="section">
            <h3>System Status</h3>
            <div id="system-status" class="log"></div>
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
        
        async function startTracing() {
            // Implementation would call API to start tracing
            console.log('Start tracing');
        }
        
        async function stopTracing() {
            // Implementation would call API to stop tracing
            console.log('Stop tracing');
        }
        
        async function setBreakpoint() {
            const file = document.getElementById('bp-file').value;
            const line = document.getElementById('bp-line').value;
            const condition = document.getElementById('bp-condition').value;
            
            if (!file || !line) {
                alert('Please provide file and line number');
                return;
            }
            
            const result = await apiCall('/api/debug/breakpoint', 'POST', {
                file: file,
                line: parseInt(line),
                condition: condition || null
            });
            
            console.log('Breakpoint set:', result);
        }
        
        async function refreshProfiles() {
            const result = await apiCall('/api/profile/results');
            const container = document.getElementById('profile-results');
            
            if (result.error) {
                container.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
                return;
            }
            
            let html = '';
            for (const [name, data] of Object.entries(result)) {
                html += `<div><strong>${name}</strong>: ${data.total_time.toFixed(3)}s</div>`;
            }
            
            container.innerHTML = html || 'No profile data available';
        }
        
        async function takeSnapshot() {
            const name = document.getElementById('snapshot-name').value;
            if (!name) {
                alert('Please provide snapshot name');
                return;
            }
            
            const result = await apiCall('/api/memory/snapshot', 'POST', { name: name });
            console.log('Snapshot taken:', result);
            
            // Refresh snapshots display
            refreshSnapshots();
        }
        
        async function refreshSnapshots() {
            const result = await apiCall('/api/memory/snapshots');
            const container = document.getElementById('memory-snapshots');
            
            if (result.error) {
                container.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
                return;
            }
            
            let html = '';
            result.forEach(snapshot => {
                html += `<div>${snapshot.name}: ${snapshot.memory_usage.rss_mb.toFixed(1)} MB</div>`;
            });
            
            container.innerHTML = html || 'No snapshots available';
        }
        
        async function analyzeLogs() {
            const logFile = document.getElementById('log-file').value;
            if (!logFile) {
                alert('Please provide log file path');
                return;
            }
            
            const result = await apiCall(`/api/logs/analyze?file=${encodeURIComponent(logFile)}`);
            const container = document.getElementById('log-analysis');
            
            if (result.error) {
                container.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
                return;
            }
            
            container.innerHTML = `<pre>${result.report}</pre>`;
        }
        
        // Auto-refresh functions
        setInterval(refreshProfiles, 10000);
        setInterval(refreshSnapshots, 15000);
        
        // Initial load
        refreshProfiles();
        refreshSnapshots();
    </script>
</body>
</html>
        """
        return web.Response(text=html, content_type='text/html')
    
    async def _debug_events_handler(self, request):
        """API handler for debug events"""
        event_type = request.query.get('type')
        limit = int(request.query.get('limit', 100))
        
        events = self.debugger.get_debug_events(event_type, limit)
        return web.json_response([asdict(event) for event in events])
    
    async def _breakpoints_handler(self, request):
        """API handler for breakpoints"""
        return web.json_response(self.debugger.breakpoints)
    
    async def _set_breakpoint_handler(self, request):
        """API handler for setting breakpoints"""
        data = await request.json()
        filename = data.get('file')
        line_number = data.get('line')
        condition = data.get('condition')
        
        if not filename or not line_number:
            return web.json_response({"error": "Missing file or line number"})
        
        self.debugger.set_breakpoint(filename, line_number, condition)
        return web.json_response({"success": True})
    
    async def _profile_results_handler(self, request):
        """API handler for profile results"""
        return web.json_response(self.profiler.get_all_profiles())
    
    async def _memory_snapshots_handler(self, request):
        """API handler for memory snapshots"""
        return web.json_response(self.memory_analyzer.snapshots)
    
    async def _take_snapshot_handler(self, request):
        """API handler for taking memory snapshots"""
        data = await request.json()
        name = data.get('name')
        
        if not name:
            return web.json_response({"error": "Missing snapshot name"})
        
        snapshot = self.memory_analyzer.take_snapshot(name)
        return web.json_response(snapshot)
    
    async def _log_analysis_handler(self, request):
        """API handler for log analysis"""
        log_file = request.query.get('file')
        
        if not log_file:
            return web.json_response({"error": "Missing log file parameter"})
        
        report = self.log_analyzer.generate_log_report(log_file)
        return web.json_response({"report": report})

async def main():
    """Main entry point for debug tools"""
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create debug components
    debugger = AdvancedDebugger()
    profiler = PerformanceProfiler()
    memory_analyzer = MemoryAnalyzer()
    log_analyzer = LogAnalyzer()
    dashboard = DebugDashboard(debugger, profiler, memory_analyzer, log_analyzer)
    
    # Start debug dashboard
    await dashboard.start_server()
    
    logger = logging.getLogger("DebugTools")
    logger.info("Debug tools started")
    logger.info("Dashboard available at http://localhost:8091")
    
    # Keep running
    try:
        while True:
            await asyncio.sleep(10)
    except KeyboardInterrupt:
        logger.info("Debug tools shutting down...")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())