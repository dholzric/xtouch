# xtouch Performance Monitoring and Debugging Tools

This directory contains comprehensive performance monitoring and debugging tools for the xtouch simulation environment, providing real-time insights, profiling capabilities, and advanced debugging features.

## Overview

The monitoring and debugging suite consists of several integrated components:

- **Performance Monitor**: Real-time system and application metrics
- **Advanced Debugger**: Breakpoints, tracing, and execution analysis
- **Performance Profiler**: Function-level performance analysis
- **Memory Analyzer**: Memory usage tracking and leak detection
- **Log Analyzer**: Automated log analysis and pattern detection
- **Debug Dashboard**: Web-based monitoring and control interface

## Quick Start

### Prerequisites

```bash
# Python packages
pip install psutil matplotlib numpy aiohttp

# System monitoring tools (Linux)
sudo apt install htop iotop nethogs

# Optional: Memory profiling tools
pip install memory_profiler pympler objgraph
```

### Starting the Monitoring Suite

```bash
# Start performance monitor
python performance_monitor.py

# Start debug tools (separate terminal)
python debug_tools.py

# Access dashboards
# Performance: http://localhost:8090
# Debug: http://localhost:8091
```

## Performance Monitor

### Features

- **Real-time Metrics**: CPU, memory, disk I/O, network I/O
- **Process Monitoring**: Per-process resource usage
- **Simulator Tracking**: Individual simulator status and metrics
- **Trend Analysis**: Historical data analysis and predictions
- **Anomaly Detection**: Automatic detection of performance issues
- **Web Dashboard**: Real-time visualization and control

### Usage

```python
from performance_monitor import PerformanceCollector, PerformanceAnalyzer

# Create collector
collector = PerformanceCollector(collection_interval=5.0)
collector.start_collection()

# Get current metrics
current_metrics = collector.get_current_metrics()
print(f"CPU: {current_metrics.cpu_percent:.1f}%")
print(f"Memory: {current_metrics.memory_mb:.1f} MB")

# Analyze trends
analyzer = PerformanceAnalyzer(collector)
analysis = analyzer.analyze_trends(duration_minutes=60)
print(f"CPU trend: {analysis['cpu_stats']['trend']}")
```

### Metrics Collected

#### System Metrics
- **CPU Usage**: Overall and per-core utilization
- **Memory Usage**: RAM usage, available memory, swap usage
- **Disk I/O**: Read/write rates, disk utilization
- **Network I/O**: Upload/download rates, connection counts
- **Load Average**: System load (Unix-like systems)

#### Process Metrics
- **Per-Process CPU**: Individual process CPU usage
- **Per-Process Memory**: Memory consumption per process
- **Thread Counts**: Number of threads per process
- **Network Connections**: Active connections per process
- **Process Status**: Running, sleeping, zombie states

#### Simulator Metrics
- **Simulator Status**: Running, stopped, error states
- **Resource Usage**: CPU and memory per simulator
- **Build/Test Counts**: Number of builds and tests executed
- **Error Tracking**: Error counts and types
- **Uptime**: How long each simulator has been running

### Dashboard Features

The web dashboard provides:

- **Real-time Charts**: Live updating performance graphs
- **System Overview**: Current system status and health
- **Process Monitor**: Top processes by resource usage
- **Simulator Status**: Individual simulator monitoring
- **Historical Analysis**: Trend analysis and reporting
- **Alert System**: Configurable performance alerts

## Advanced Debugger

### Capabilities

- **Breakpoints**: Conditional breakpoints with custom conditions
- **Execution Tracing**: Function call tracing and analysis
- **Variable Watching**: Monitor variable changes
- **Call Stack Analysis**: Detailed call stack inspection
- **Event Recording**: Comprehensive debug event logging

### Setting Breakpoints

```python
from debug_tools import AdvancedDebugger

debugger = AdvancedDebugger()

# Simple breakpoint
debugger.set_breakpoint("src/main.cpp", 45)

# Conditional breakpoint
debugger.set_breakpoint("src/audio.cpp", 120, "volume > 0.8")

# Start tracing
debugger.start_tracing()
```

### Variable Watching

```python
# Watch a variable
debugger.set_watchpoint("audio_buffer", "len(audio_buffer) > 1000")

# Watch with complex condition
debugger.set_watchpoint("build_status", "build_status == 'failed'")
```

### Debug Event Analysis

```python
# Get recent debug events
events = debugger.get_debug_events(event_type="call", limit=50)

# Analyze call patterns
analysis = debugger.analyze_call_patterns()
print(f"Most frequent call: {analysis['call_patterns'][0]}")
```

## Performance Profiler

### Function Profiling

```python
from debug_tools import PerformanceProfiler

profiler = PerformanceProfiler()

# Profile a function using context manager
with profiler.profile_function("audio_processing"):
    process_audio_buffer()

# Profile using decorator
@profiler.profile_decorator("ui_render")
def render_ui():
    # UI rendering code
    pass

# Get profile results
results = profiler.get_profile_results("audio_processing")
print(f"Function took: {results['total_time']:.3f}s")
```

### Profile Comparison

```python
# Compare current profile with baseline
baseline_time = time.time() - 3600  # 1 hour ago
comparison = profiler.compare_profiles("audio_processing", baseline_time)

if comparison["regression"]:
    print(f"Performance regression detected: {comparison['time_delta']:.3f}s slower")
```

## Memory Analyzer

### Memory Tracking

```python
from debug_tools import MemoryAnalyzer

analyzer = MemoryAnalyzer()

# Take memory snapshots
analyzer.take_snapshot("startup")
# ... run some code ...
analyzer.take_snapshot("after_processing")

# Compare snapshots
comparison = analyzer.compare_snapshots("startup", "after_processing")
print(f"Memory change: {comparison['memory_delta_mb']:.1f} MB")

# Detect memory leaks
leaks = analyzer.detect_memory_leaks()
for leak in leaks:
    print(f"Potential leak: {leak['memory_increase_mb']:.1f} MB")
```

### Object Lifecycle Tracking

```python
# Track specific objects
my_object = MyClass()
analyzer.track_object_lifecycle(my_object, "important_object")

# Object deletion will be logged automatically
del my_object
```

## Log Analyzer

### Automated Log Analysis

```python
from debug_tools import LogAnalyzer

analyzer = LogAnalyzer()

# Analyze log file
analysis = analyzer.analyze_log_file("/path/to/logfile.log")
print(f"Errors found: {analysis['error_count']}")
print(f"Performance issues: {len(analysis['performance_issues'])}")

# Generate comprehensive report
report = analyzer.generate_log_report("/path/to/logfile.log")
print(report)
```

### Pattern Detection

The log analyzer automatically detects:

- **Error Patterns**: Common error types and frequencies
- **Performance Issues**: High CPU/memory usage, slow operations
- **Build Patterns**: Build success/failure rates
- **Test Patterns**: Test execution and results
- **Connection Issues**: Network and connectivity problems

## Integration with Development Workflow

### Continuous Monitoring

```python
# monitoring_daemon.py
import asyncio
from performance_monitor import PerformanceCollector, PerformanceAnalyzer
from debug_tools import MemoryAnalyzer

async def continuous_monitoring():
    collector = PerformanceCollector()
    analyzer = PerformanceAnalyzer(collector)
    memory_analyzer = MemoryAnalyzer()
    
    collector.start_collection()
    
    while True:
        # Take periodic memory snapshots
        memory_analyzer.take_snapshot(f"periodic_{int(time.time())}")
        
        # Analyze performance trends
        trends = analyzer.analyze_trends(duration_minutes=15)
        
        # Check for issues
        if trends.get("anomalies"):
            print("Performance anomalies detected!")
            
        await asyncio.sleep(300)  # Check every 5 minutes

# Run monitoring daemon
asyncio.run(continuous_monitoring())
```

### Build Integration

```bash
# Add to build scripts
python -c "
from debug_tools import PerformanceProfiler
profiler = PerformanceProfiler()
with profiler.profile_function('build'):
    subprocess.run(['pio', 'run'])
"
```

### Test Integration

```python
# test_with_profiling.py
import pytest
from debug_tools import PerformanceProfiler, MemoryAnalyzer

profiler = PerformanceProfiler()
memory_analyzer = MemoryAnalyzer()

@pytest.fixture(autouse=True)
def profile_test(request):
    test_name = request.node.name
    memory_analyzer.take_snapshot(f"test_start_{test_name}")
    
    with profiler.profile_function(test_name):
        yield
    
    memory_analyzer.take_snapshot(f"test_end_{test_name}")
    
    # Check for memory leaks in test
    comparison = memory_analyzer.compare_snapshots(
        f"test_start_{test_name}",
        f"test_end_{test_name}"
    )
    
    if comparison.get("potential_leak"):
        pytest.warn(f"Potential memory leak in {test_name}")
```

## Configuration

### Environment Variables

```bash
# Performance monitoring
export PERF_COLLECTION_INTERVAL=5.0      # Collection interval in seconds
export PERF_DASHBOARD_PORT=8090           # Dashboard port
export PERF_HISTORY_SIZE=1000            # Number of metrics to keep

# Debugging
export DEBUG_DASHBOARD_PORT=8091          # Debug dashboard port
export DEBUG_TRACE_ENABLED=false         # Enable tracing by default
export DEBUG_MEMORY_PROFILING=true       # Enable memory profiling

# Log analysis
export LOG_ANALYSIS_PATTERNS=/path/to/patterns.json  # Custom patterns file
```

### Configuration Files

Create `monitoring_config.json`:

```json
{
  "performance": {
    "collection_interval": 5.0,
    "dashboard_port": 8090,
    "enable_process_monitoring": true,
    "enable_simulator_tracking": true
  },
  "debugging": {
    "dashboard_port": 8091,
    "auto_breakpoints": [
      {"file": "src/main.cpp", "line": 100, "condition": "error_count > 0"},
      {"file": "src/audio.cpp", "line": 50, "condition": "buffer_overflow"}
    ],
    "watchpoints": [
      {"variable": "memory_usage", "condition": "memory_usage > 1000000000"}
    ]
  },
  "memory": {
    "auto_snapshots": true,
    "snapshot_interval": 300,
    "leak_detection_threshold": 10
  },
  "logging": {
    "log_files": [
      "/workspace/hot_reload.log",
      "/workspace/performance_monitor.log",
      "/workspace/test_results.log"
    ],
    "analysis_interval": 600
  }
}
```

## API Reference

### Performance Monitor API

```python
# Start monitoring
collector = PerformanceCollector(collection_interval=5.0)
collector.start_collection()

# Get metrics
current = collector.get_current_metrics()
history = collector.get_metrics_history(duration_minutes=60)
processes = collector.get_process_metrics()
simulators = collector.get_simulator_metrics()

# Analysis
analyzer = PerformanceAnalyzer(collector)
trends = analyzer.analyze_trends(duration_minutes=60)
report = analyzer.generate_performance_report(duration_minutes=60)
```

### Debug Tools API

```python
# Advanced debugger
debugger = AdvancedDebugger()
debugger.set_breakpoint("file.py", 100, "x > 10")
debugger.set_watchpoint("variable", "variable != expected")
debugger.start_tracing()

# Performance profiler
profiler = PerformanceProfiler()
with profiler.profile_function("function_name"):
    # code to profile
    pass

# Memory analyzer
memory = MemoryAnalyzer()
snapshot = memory.take_snapshot("snapshot_name")
leaks = memory.detect_memory_leaks()

# Log analyzer
logs = LogAnalyzer()
analysis = logs.analyze_log_file("logfile.log")
report = logs.generate_log_report("logfile.log")
```

### Web API Endpoints

#### Performance Monitor (http://localhost:8090/api/)

- `GET /metrics` - Current system metrics
- `GET /metrics/history?duration=60` - Historical metrics
- `GET /analysis?duration=60` - Performance analysis
- `GET /processes` - Process metrics
- `GET /simulators` - Simulator status

#### Debug Dashboard (http://localhost:8091/api/)

- `GET /debug/events?type=call&limit=100` - Debug events
- `GET /debug/breakpoints` - Current breakpoints
- `POST /debug/breakpoint` - Set breakpoint
- `GET /profile/results` - Profile results
- `GET /memory/snapshots` - Memory snapshots
- `POST /memory/snapshot` - Take snapshot
- `GET /logs/analyze?file=path` - Analyze log file

## Performance Optimization

### Best Practices

1. **Monitoring Frequency**: Balance detail vs. overhead
   - High-frequency monitoring (1-5s) for active development
   - Lower frequency (30-60s) for production monitoring

2. **Data Retention**: Manage memory usage
   - Keep recent high-resolution data (last hour)
   - Aggregate older data for long-term trends

3. **Selective Profiling**: Profile critical paths only
   - Use conditional profiling based on performance thresholds
   - Profile during specific test scenarios

4. **Memory Monitoring**: Regular snapshots
   - Take snapshots at key points (startup, after operations)
   - Compare snapshots to detect leaks early

### Performance Impact

The monitoring tools themselves have minimal performance impact:

- **Performance Monitor**: ~1-2% CPU overhead
- **Debug Tracing**: ~5-10% CPU overhead when enabled
- **Memory Snapshots**: Brief CPU spike during snapshot
- **Web Dashboards**: Minimal impact, served asynchronously

## Troubleshooting

### Common Issues

1. **High Memory Usage in Monitor**:
   ```python
   # Reduce history size
   collector = PerformanceCollector()
   collector.metrics_history = deque(maxlen=500)  # Reduce from 1000
   ```

2. **Debug Tracing Too Verbose**:
   ```python
   # Filter traced files
   def _trace_calls(self, frame, event, arg):
       filename = frame.f_code.co_filename
       if not any(pattern in filename for pattern in ['xtouch', 'simulation']):
           return None  # Don't trace system files
   ```

3. **Dashboard Not Accessible**:
   ```bash
   # Check if ports are available
   netstat -tlnp | grep :8090
   
   # Try different port
   python performance_monitor.py --port 8095
   ```

4. **Memory Profiling Unavailable**:
   ```python
   # Check tracemalloc availability
   import tracemalloc
   if tracemalloc.is_tracing():
       print("Memory tracing available")
   else:
       tracemalloc.start()
   ```

### Debug Logging

Enable debug logging for troubleshooting:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Or for specific components
logging.getLogger("PerformanceCollector").setLevel(logging.DEBUG)
logging.getLogger("AdvancedDebugger").setLevel(logging.DEBUG)
```

### Performance Tuning

```python
# Optimize collection frequency based on usage
if development_mode:
    collection_interval = 1.0  # High frequency for development
else:
    collection_interval = 30.0  # Lower frequency for production

# Selective process monitoring
def should_monitor_process(process_name):
    important_processes = ['python', 'node', 'pio', 'wokwi']
    return any(proc in process_name.lower() for proc in important_processes)
```

## Contributing

### Adding New Metrics

1. **Extend PerformanceMetrics dataclass**:
```python
@dataclass
class PerformanceMetrics:
    # ... existing fields ...
    custom_metric: float = 0.0
```

2. **Update collection logic**:
```python
def _collect_metrics(self) -> PerformanceMetrics:
    # ... existing collection ...
    custom_value = self._collect_custom_metric()
    
    return PerformanceMetrics(
        # ... existing fields ...
        custom_metric=custom_value
    )
```

3. **Add dashboard visualization**:
```javascript
// Update dashboard to display new metric
document.getElementById('custom-metric').textContent = data.custom_metric;
```

### Adding Debug Features

1. **Extend AdvancedDebugger**:
```python
def set_custom_breakpoint(self, condition_func):
    # Custom breakpoint logic
    pass
```

2. **Add API endpoints**:
```python
async def _custom_debug_handler(self, request):
    # Handle custom debug requests
    pass
```

### Testing

```bash
# Run tests for monitoring tools
python -m pytest tests/test_monitoring.py

# Performance test the monitors themselves
python tests/benchmark_monitors.py

# Integration test with simulators
python tests/test_monitor_integration.py
```

## License

This monitoring and debugging suite is part of the xtouch project and is licensed under GPL-3.0.