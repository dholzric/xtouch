#!/usr/bin/env python3
"""
Performance Monitoring and Debugging Tools for xtouch Simulation Environment
"""

import os
import sys
import time
import json
import psutil
import logging
import threading
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import asyncio
import aiohttp
from aiohttp import web
import matplotlib.pyplot as plt
import numpy as np
from collections import deque, defaultdict

@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    timestamp: float
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    disk_io_read: float
    disk_io_write: float
    network_io_sent: float
    network_io_recv: float
    build_time: Optional[float] = None
    test_time: Optional[float] = None
    active_processes: int = 0
    load_average: Optional[float] = None

@dataclass
class ProcessMetrics:
    """Per-process metrics"""
    pid: int
    name: str
    cpu_percent: float
    memory_mb: float
    memory_percent: float
    status: str
    create_time: float
    num_threads: int
    connections: int = 0

@dataclass
class SimulatorMetrics:
    """Simulator-specific metrics"""
    name: str
    status: str
    uptime: float
    cpu_usage: float
    memory_usage: float
    build_count: int
    test_count: int
    error_count: int
    last_build_time: Optional[float] = None
    last_test_time: Optional[float] = None

class PerformanceCollector:
    """Collects system and application performance metrics"""
    
    def __init__(self, collection_interval: float = 5.0):
        self.collection_interval = collection_interval
        self.metrics_history = deque(maxlen=1000)  # Keep last 1000 measurements
        self.process_metrics = {}
        self.simulator_metrics = {}
        self.is_collecting = False
        self.logger = logging.getLogger("PerformanceCollector")
        
        # Initialize baseline measurements
        self._last_disk_io = psutil.disk_io_counters()
        self._last_network_io = psutil.net_io_counters()
        self._last_measurement_time = time.time()
        
    def start_collection(self):
        """Start performance metric collection"""
        if self.is_collecting:
            return
        
        self.is_collecting = True
        self.collection_thread = threading.Thread(target=self._collection_loop)
        self.collection_thread.daemon = True
        self.collection_thread.start()
        self.logger.info("Performance collection started")
    
    def stop_collection(self):
        """Stop performance metric collection"""
        self.is_collecting = False
        if hasattr(self, 'collection_thread'):
            self.collection_thread.join(timeout=5)
        self.logger.info("Performance collection stopped")
    
    def _collection_loop(self):
        """Main collection loop"""
        while self.is_collecting:
            try:
                metrics = self._collect_metrics()
                self.metrics_history.append(metrics)
                self._update_process_metrics()
                self._update_simulator_metrics()
                
                # Log critical metrics
                if metrics.cpu_percent > 90:
                    self.logger.warning(f"High CPU usage: {metrics.cpu_percent:.1f}%")
                if metrics.memory_percent > 90:
                    self.logger.warning(f"High memory usage: {metrics.memory_percent:.1f}%")
                
            except Exception as e:
                self.logger.error(f"Error collecting metrics: {e}")
            
            time.sleep(self.collection_interval)
    
    def _collect_metrics(self) -> PerformanceMetrics:
        """Collect current system metrics"""
        current_time = time.time()
        
        # CPU and Memory
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        # Disk I/O
        current_disk_io = psutil.disk_io_counters()
        time_delta = current_time - self._last_measurement_time
        
        if self._last_disk_io and time_delta > 0:
            disk_read_rate = (current_disk_io.read_bytes - self._last_disk_io.read_bytes) / time_delta
            disk_write_rate = (current_disk_io.write_bytes - self._last_disk_io.write_bytes) / time_delta
        else:
            disk_read_rate = disk_write_rate = 0
        
        # Network I/O
        current_network_io = psutil.net_io_counters()
        if self._last_network_io and time_delta > 0:
            network_sent_rate = (current_network_io.bytes_sent - self._last_network_io.bytes_sent) / time_delta
            network_recv_rate = (current_network_io.bytes_recv - self._last_network_io.bytes_recv) / time_delta
        else:
            network_sent_rate = network_recv_rate = 0
        
        # Load average (Unix-like systems)
        load_avg = None
        try:
            load_avg = os.getloadavg()[0]  # 1-minute load average
        except (OSError, AttributeError):
            pass  # Not available on Windows
        
        # Update baseline measurements
        self._last_disk_io = current_disk_io
        self._last_network_io = current_network_io
        self._last_measurement_time = current_time
        
        return PerformanceMetrics(
            timestamp=current_time,
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            memory_mb=memory.used / (1024 * 1024),
            disk_io_read=disk_read_rate,
            disk_io_write=disk_write_rate,
            network_io_sent=network_sent_rate,
            network_io_recv=network_recv_rate,
            active_processes=len(psutil.pids()),
            load_average=load_avg
        )
    
    def _update_process_metrics(self):
        """Update per-process metrics"""
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'memory_percent', 'status', 'create_time', 'num_threads']):
            try:
                proc_info = proc.info
                if proc_info['name'] in ['python3', 'node', 'pio', 'make', 'cmake', 'wokwi-cli']:
                    # Count network connections for relevant processes
                    connections = 0
                    try:
                        connections = len(proc.connections())
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                    
                    self.process_metrics[proc_info['pid']] = ProcessMetrics(
                        pid=proc_info['pid'],
                        name=proc_info['name'],
                        cpu_percent=proc_info['cpu_percent'] or 0,
                        memory_mb=proc_info['memory_info'].rss / (1024 * 1024),
                        memory_percent=proc_info['memory_percent'] or 0,
                        status=proc_info['status'],
                        create_time=proc_info['create_time'],
                        num_threads=proc_info['num_threads'],
                        connections=connections
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
    
    def _update_simulator_metrics(self):
        """Update simulator-specific metrics"""
        simulators = ['wokwi', 'lvgl', 'audio', 'web']
        
        for sim_name in simulators:
            if sim_name not in self.simulator_metrics:
                self.simulator_metrics[sim_name] = SimulatorMetrics(
                    name=sim_name,
                    status='unknown',
                    uptime=0,
                    cpu_usage=0,
                    memory_usage=0,
                    build_count=0,
                    test_count=0,
                    error_count=0
                )
            
            # Update metrics based on running processes
            sim_metrics = self.simulator_metrics[sim_name]
            sim_processes = self._get_simulator_processes(sim_name)
            
            if sim_processes:
                sim_metrics.status = 'running'
                sim_metrics.cpu_usage = sum(p.cpu_percent for p in sim_processes)
                sim_metrics.memory_usage = sum(p.memory_mb for p in sim_processes)
                sim_metrics.uptime = time.time() - min(p.create_time for p in sim_processes)
            else:
                sim_metrics.status = 'stopped'
                sim_metrics.cpu_usage = 0
                sim_metrics.memory_usage = 0
    
    def _get_simulator_processes(self, simulator_name: str) -> List[ProcessMetrics]:
        """Get processes related to a specific simulator"""
        related_processes = []
        
        process_patterns = {
            'wokwi': ['wokwi'],
            'lvgl': ['xtouch_lvgl_simulator'],
            'audio': ['xtouch_audio_simulator'],
            'web': ['node', 'npm']
        }
        
        patterns = process_patterns.get(simulator_name, [])
        
        for proc_metrics in self.process_metrics.values():
            if any(pattern in proc_metrics.name.lower() for pattern in patterns):
                related_processes.append(proc_metrics)
        
        return related_processes
    
    def get_current_metrics(self) -> Optional[PerformanceMetrics]:
        """Get the most recent metrics"""
        if self.metrics_history:
            return self.metrics_history[-1]
        return None
    
    def get_metrics_history(self, duration_minutes: int = 60) -> List[PerformanceMetrics]:
        """Get metrics history for specified duration"""
        cutoff_time = time.time() - (duration_minutes * 60)
        return [m for m in self.metrics_history if m.timestamp >= cutoff_time]
    
    def get_process_metrics(self) -> Dict[int, ProcessMetrics]:
        """Get current process metrics"""
        return self.process_metrics.copy()
    
    def get_simulator_metrics(self) -> Dict[str, SimulatorMetrics]:
        """Get current simulator metrics"""
        return self.simulator_metrics.copy()

class PerformanceAnalyzer:
    """Analyzes performance data and generates insights"""
    
    def __init__(self, collector: PerformanceCollector):
        self.collector = collector
        self.logger = logging.getLogger("PerformanceAnalyzer")
    
    def analyze_trends(self, duration_minutes: int = 60) -> Dict[str, Any]:
        """Analyze performance trends over specified duration"""
        metrics = self.collector.get_metrics_history(duration_minutes)
        
        if len(metrics) < 2:
            return {"error": "Insufficient data for analysis"}
        
        # Calculate statistics
        cpu_values = [m.cpu_percent for m in metrics]
        memory_values = [m.memory_percent for m in metrics]
        
        analysis = {
            "duration_minutes": duration_minutes,
            "sample_count": len(metrics),
            "cpu_stats": {
                "average": np.mean(cpu_values),
                "max": np.max(cpu_values),
                "min": np.min(cpu_values),
                "std_dev": np.std(cpu_values),
                "trend": self._calculate_trend(cpu_values)
            },
            "memory_stats": {
                "average": np.mean(memory_values),
                "max": np.max(memory_values),
                "min": np.min(memory_values),
                "std_dev": np.std(memory_values),
                "trend": self._calculate_trend(memory_values)
            },
            "io_stats": self._analyze_io_patterns(metrics),
            "anomalies": self._detect_anomalies(metrics),
            "recommendations": self._generate_recommendations(metrics)
        }
        
        return analysis
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction for a series of values"""
        if len(values) < 2:
            return "insufficient_data"
        
        # Simple linear regression to determine trend
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]
        
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"
    
    def _analyze_io_patterns(self, metrics: List[PerformanceMetrics]) -> Dict[str, Any]:
        """Analyze I/O patterns"""
        disk_read = [m.disk_io_read for m in metrics]
        disk_write = [m.disk_io_write for m in metrics]
        network_sent = [m.network_io_sent for m in metrics]
        network_recv = [m.network_io_recv for m in metrics]
        
        return {
            "disk_read_avg": np.mean(disk_read),
            "disk_write_avg": np.mean(disk_write),
            "network_sent_avg": np.mean(network_sent),
            "network_recv_avg": np.mean(network_recv),
            "peak_disk_activity": max(max(disk_read), max(disk_write)),
            "peak_network_activity": max(max(network_sent), max(network_recv))
        }
    
    def _detect_anomalies(self, metrics: List[PerformanceMetrics]) -> List[Dict[str, Any]]:
        """Detect performance anomalies"""
        anomalies = []
        
        cpu_values = [m.cpu_percent for m in metrics]
        memory_values = [m.memory_percent for m in metrics]
        
        # CPU spikes
        cpu_threshold = np.mean(cpu_values) + 2 * np.std(cpu_values)
        for i, metric in enumerate(metrics):
            if metric.cpu_percent > cpu_threshold and metric.cpu_percent > 80:
                anomalies.append({
                    "type": "cpu_spike",
                    "timestamp": metric.timestamp,
                    "value": metric.cpu_percent,
                    "severity": "high" if metric.cpu_percent > 95 else "medium"
                })
        
        # Memory spikes
        memory_threshold = np.mean(memory_values) + 2 * np.std(memory_values)
        for metric in metrics:
            if metric.memory_percent > memory_threshold and metric.memory_percent > 85:
                anomalies.append({
                    "type": "memory_spike",
                    "timestamp": metric.timestamp,
                    "value": metric.memory_percent,
                    "severity": "high" if metric.memory_percent > 95 else "medium"
                })
        
        return anomalies
    
    def _generate_recommendations(self, metrics: List[PerformanceMetrics]) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        cpu_avg = np.mean([m.cpu_percent for m in metrics])
        memory_avg = np.mean([m.memory_percent for m in metrics])
        
        if cpu_avg > 70:
            recommendations.append("Consider optimizing CPU-intensive operations or scaling horizontally")
        
        if memory_avg > 80:
            recommendations.append("Memory usage is high - check for memory leaks or increase available RAM")
        
        # Check for build time patterns
        build_times = [m.build_time for m in metrics if m.build_time]
        if build_times and np.mean(build_times) > 30:
            recommendations.append("Build times are high - consider enabling incremental builds or caching")
        
        # Check process count
        process_counts = [m.active_processes for m in metrics]
        if np.mean(process_counts) > 200:
            recommendations.append("High process count detected - check for process leaks")
        
        return recommendations
    
    def generate_performance_report(self, duration_minutes: int = 60) -> str:
        """Generate a comprehensive performance report"""
        analysis = self.analyze_trends(duration_minutes)
        simulator_metrics = self.collector.get_simulator_metrics()
        
        report = []
        report.append("=" * 60)
        report.append("XTOUCH PERFORMANCE ANALYSIS REPORT")
        report.append("=" * 60)
        report.append(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Analysis period: {duration_minutes} minutes")
        report.append("")
        
        # System Overview
        report.append("SYSTEM OVERVIEW")
        report.append("-" * 20)
        if "cpu_stats" in analysis:
            cpu_stats = analysis["cpu_stats"]
            report.append(f"CPU Usage: {cpu_stats['average']:.1f}% avg, {cpu_stats['max']:.1f}% peak")
            report.append(f"CPU Trend: {cpu_stats['trend']}")
            
            memory_stats = analysis["memory_stats"]
            report.append(f"Memory Usage: {memory_stats['average']:.1f}% avg, {memory_stats['max']:.1f}% peak")
            report.append(f"Memory Trend: {memory_stats['trend']}")
            
            if "io_stats" in analysis:
                io_stats = analysis["io_stats"]
                report.append(f"Disk I/O: {io_stats['disk_read_avg']:.1f} MB/s read, {io_stats['disk_write_avg']:.1f} MB/s write")
                report.append(f"Network I/O: {io_stats['network_sent_avg']:.1f} MB/s sent, {io_stats['network_recv_avg']:.1f} MB/s recv")
        
        report.append("")
        
        # Simulator Status
        report.append("SIMULATOR STATUS")
        report.append("-" * 20)
        for name, sim_metrics in simulator_metrics.items():
            report.append(f"{name.upper()}: {sim_metrics.status}")
            if sim_metrics.status == 'running':
                report.append(f"  Uptime: {sim_metrics.uptime:.0f}s")
                report.append(f"  CPU: {sim_metrics.cpu_usage:.1f}%")
                report.append(f"  Memory: {sim_metrics.memory_usage:.1f} MB")
                report.append(f"  Builds: {sim_metrics.build_count}, Tests: {sim_metrics.test_count}")
        
        report.append("")
        
        # Anomalies
        if "anomalies" in analysis and analysis["anomalies"]:
            report.append("PERFORMANCE ANOMALIES")
            report.append("-" * 20)
            for anomaly in analysis["anomalies"][-10:]:  # Last 10 anomalies
                timestamp = datetime.fromtimestamp(anomaly["timestamp"]).strftime('%H:%M:%S')
                report.append(f"{timestamp}: {anomaly['type']} - {anomaly['value']:.1f}% ({anomaly['severity']})")
        
        report.append("")
        
        # Recommendations
        if "recommendations" in analysis and analysis["recommendations"]:
            report.append("RECOMMENDATIONS")
            report.append("-" * 20)
            for i, rec in enumerate(analysis["recommendations"], 1):
                report.append(f"{i}. {rec}")
        
        return "\n".join(report)

class PerformanceDashboard:
    """Web-based performance monitoring dashboard"""
    
    def __init__(self, collector: PerformanceCollector, analyzer: PerformanceAnalyzer, port: int = 8090):
        self.collector = collector
        self.analyzer = analyzer
        self.port = port
        self.app = web.Application()
        self.setup_routes()
        self.logger = logging.getLogger("PerformanceDashboard")
    
    def setup_routes(self):
        """Setup web routes"""
        self.app.router.add_get('/', self.dashboard_handler)
        self.app.router.add_get('/api/metrics', self.metrics_api_handler)
        self.app.router.add_get('/api/metrics/history', self.metrics_history_handler)
        self.app.router.add_get('/api/analysis', self.analysis_handler)
        self.app.router.add_get('/api/processes', self.processes_handler)
        self.app.router.add_get('/api/simulators', self.simulators_handler)
        self.app.router.add_static('/', path='static', name='static')
    
    async def dashboard_handler(self, request):
        """Serve the main dashboard HTML"""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>xtouch Performance Monitor</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
        .container { max-width: 1400px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .card { background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; color: #007acc; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .chart-container { height: 300px; margin: 20px 0; }
        button { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #005a9e; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #444; }
        th { background: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>xtouch Performance Monitor</h1>
        
        <div class="grid">
            <div class="card">
                <h3>System Metrics</h3>
                <div class="metric">
                    <span>CPU Usage:</span>
                    <span class="metric-value" id="cpu-usage">--</span>
                </div>
                <div class="metric">
                    <span>Memory Usage:</span>
                    <span class="metric-value" id="memory-usage">--</span>
                </div>
                <div class="metric">
                    <span>Load Average:</span>
                    <span class="metric-value" id="load-average">--</span>
                </div>
                <div class="metric">
                    <span>Active Processes:</span>
                    <span class="metric-value" id="active-processes">--</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Simulator Status</h3>
                <div id="simulator-status">
                    Loading...
                </div>
            </div>
            
            <div class="card">
                <h3>I/O Statistics</h3>
                <div class="metric">
                    <span>Disk Read:</span>
                    <span class="metric-value" id="disk-read">--</span>
                </div>
                <div class="metric">
                    <span>Disk Write:</span>
                    <span class="metric-value" id="disk-write">--</span>
                </div>
                <div class="metric">
                    <span>Network Sent:</span>
                    <span class="metric-value" id="network-sent">--</span>
                </div>
                <div class="metric">
                    <span>Network Received:</span>
                    <span class="metric-value" id="network-recv">--</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Actions</h3>
                <button onclick="generateReport()">Generate Report</button>
                <button onclick="exportData()">Export Data</button>
                <button onclick="clearData()">Clear History</button>
                <button onclick="toggleCollection()">Toggle Collection</button>
            </div>
        </div>
        
        <div class="card">
            <h3>Performance Charts</h3>
            <div class="chart-container">
                <canvas id="performance-chart"></canvas>
            </div>
        </div>
        
        <div class="card">
            <h3>Process Monitor</h3>
            <table id="process-table">
                <thead>
                    <tr>
                        <th>PID</th>
                        <th>Name</th>
                        <th>CPU %</th>
                        <th>Memory MB</th>
                        <th>Status</th>
                        <th>Threads</th>
                    </tr>
                </thead>
                <tbody id="process-tbody">
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h3>Performance Analysis</h3>
            <div id="analysis-content">
                <p>Click "Generate Report" to see detailed analysis</p>
            </div>
        </div>
    </div>
    
    <script>
        let performanceChart;
        
        function initChart() {
            const ctx = document.getElementById('performance-chart').getContext('2d');
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'CPU %',
                        data: [],
                        borderColor: '#007acc',
                        tension: 0.1
                    }, {
                        label: 'Memory %',
                        data: [],
                        borderColor: '#28a745',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#fff'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });
        }
        
        async function updateMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                if (data.error) {
                    console.error('Error fetching metrics:', data.error);
                    return;
                }
                
                // Update current metrics
                document.getElementById('cpu-usage').textContent = data.cpu_percent.toFixed(1) + '%';
                document.getElementById('memory-usage').textContent = data.memory_percent.toFixed(1) + '%';
                document.getElementById('load-average').textContent = data.load_average?.toFixed(2) || 'N/A';
                document.getElementById('active-processes').textContent = data.active_processes;
                
                document.getElementById('disk-read').textContent = formatBytes(data.disk_io_read) + '/s';
                document.getElementById('disk-write').textContent = formatBytes(data.disk_io_write) + '/s';
                document.getElementById('network-sent').textContent = formatBytes(data.network_io_sent) + '/s';
                document.getElementById('network-recv').textContent = formatBytes(data.network_io_recv) + '/s';
                
                // Update chart
                updateChart(data);
                
            } catch (error) {
                console.error('Error updating metrics:', error);
            }
        }
        
        async function updateSimulators() {
            try {
                const response = await fetch('/api/simulators');
                const data = await response.json();
                
                const container = document.getElementById('simulator-status');
                container.innerHTML = '';
                
                for (const [name, metrics] of Object.entries(data)) {
                    const statusClass = metrics.status === 'running' ? 'status-good' : 'status-error';
                    const div = document.createElement('div');
                    div.className = 'metric';
                    div.innerHTML = `
                        <span>${name.toUpperCase()}:</span>
                        <span class="metric-value ${statusClass}">${metrics.status}</span>
                    `;
                    container.appendChild(div);
                    
                    if (metrics.status === 'running') {
                        const details = document.createElement('div');
                        details.style.fontSize = '0.9em';
                        details.style.color = '#aaa';
                        details.innerHTML = `CPU: ${metrics.cpu_usage.toFixed(1)}%, Memory: ${metrics.memory_usage.toFixed(1)} MB`;
                        container.appendChild(details);
                    }
                }
                
            } catch (error) {
                console.error('Error updating simulators:', error);
            }
        }
        
        async function updateProcesses() {
            try {
                const response = await fetch('/api/processes');
                const data = await response.json();
                
                const tbody = document.getElementById('process-tbody');
                tbody.innerHTML = '';
                
                // Sort by CPU usage
                const processes = Object.values(data).sort((a, b) => b.cpu_percent - a.cpu_percent).slice(0, 10);
                
                processes.forEach(proc => {
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${proc.pid}</td>
                        <td>${proc.name}</td>
                        <td>${proc.cpu_percent.toFixed(1)}%</td>
                        <td>${proc.memory_mb.toFixed(1)}</td>
                        <td>${proc.status}</td>
                        <td>${proc.num_threads}</td>
                    `;
                });
                
            } catch (error) {
                console.error('Error updating processes:', error);
            }
        }
        
        function updateChart(data) {
            const chart = performanceChart;
            const now = new Date().toLocaleTimeString();
            
            // Add new data point
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(data.cpu_percent);
            chart.data.datasets[1].data.push(data.memory_percent);
            
            // Keep only last 20 points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.update('none');
        }
        
        async function generateReport() {
            try {
                const response = await fetch('/api/analysis');
                const data = await response.json();
                
                const content = document.getElementById('analysis-content');
                content.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                
            } catch (error) {
                console.error('Error generating report:', error);
            }
        }
        
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        
        function exportData() {
            // Implementation for data export
            alert('Export functionality would be implemented here');
        }
        
        function clearData() {
            if (confirm('Clear all performance history?')) {
                // Implementation for clearing data
                alert('Clear functionality would be implemented here');
            }
        }
        
        function toggleCollection() {
            // Implementation for toggling collection
            alert('Toggle functionality would be implemented here');
        }
        
        // Initialize
        initChart();
        updateMetrics();
        updateSimulators();
        updateProcesses();
        
        // Update every 5 seconds
        setInterval(updateMetrics, 5000);
        setInterval(updateSimulators, 10000);
        setInterval(updateProcesses, 15000);
    </script>
</body>
</html>
        """
        return web.Response(text=html_content, content_type='text/html')
    
    async def metrics_api_handler(self, request):
        """API endpoint for current metrics"""
        metrics = self.collector.get_current_metrics()
        if metrics:
            return web.json_response(asdict(metrics))
        else:
            return web.json_response({"error": "No metrics available"})
    
    async def metrics_history_handler(self, request):
        """API endpoint for metrics history"""
        duration = int(request.query.get('duration', 60))
        metrics = self.collector.get_metrics_history(duration)
        return web.json_response([asdict(m) for m in metrics])
    
    async def analysis_handler(self, request):
        """API endpoint for performance analysis"""
        duration = int(request.query.get('duration', 60))
        analysis = self.analyzer.analyze_trends(duration)
        return web.json_response(analysis)
    
    async def processes_handler(self, request):
        """API endpoint for process metrics"""
        processes = self.collector.get_process_metrics()
        return web.json_response({pid: asdict(proc) for pid, proc in processes.items()})
    
    async def simulators_handler(self, request):
        """API endpoint for simulator metrics"""
        simulators = self.collector.get_simulator_metrics()
        return web.json_response({name: asdict(sim) for name, sim in simulators.items()})
    
    async def start_server(self):
        """Start the web server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        self.logger.info(f"Performance dashboard started on http://localhost:{self.port}")

class DebugToolkit:
    """Debugging tools and utilities"""
    
    def __init__(self):
        self.logger = logging.getLogger("DebugToolkit")
        self.trace_enabled = False
        self.breakpoints = set()
    
    def enable_memory_profiling(self):
        """Enable memory profiling"""
        try:
            import tracemalloc
            tracemalloc.start()
            self.logger.info("Memory profiling enabled")
            return True
        except ImportError:
            self.logger.error("tracemalloc not available")
            return False
    
    def get_memory_snapshot(self):
        """Get current memory snapshot"""
        try:
            import tracemalloc
            snapshot = tracemalloc.take_snapshot()
            top_stats = snapshot.statistics('lineno')
            
            memory_info = []
            for stat in top_stats[:10]:
                memory_info.append({
                    "filename": stat.traceback.format()[-1],
                    "size_mb": stat.size / (1024 * 1024),
                    "count": stat.count
                })
            
            return memory_info
        except Exception as e:
            self.logger.error(f"Error getting memory snapshot: {e}")
            return []
    
    def profile_function(self, func, *args, **kwargs):
        """Profile a function execution"""
        import cProfile
        import io
        import pstats
        
        profiler = cProfile.Profile()
        profiler.enable()
        
        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()
        
        # Get profiling results
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s)
        ps.sort_stats('cumulative')
        ps.print_stats(20)  # Top 20 functions
        
        profile_output = s.getvalue()
        self.logger.info(f"Profile results for {func.__name__}:\n{profile_output}")
        
        return result
    
    def trace_calls(self, enabled: bool = True):
        """Enable/disable call tracing"""
        if enabled:
            import sys
            sys.settrace(self._trace_function)
            self.trace_enabled = True
            self.logger.info("Call tracing enabled")
        else:
            import sys
            sys.settrace(None)
            self.trace_enabled = False
            self.logger.info("Call tracing disabled")
    
    def _trace_function(self, frame, event, arg):
        """Trace function calls"""
        if event == 'call':
            filename = frame.f_code.co_filename
            function_name = frame.f_code.co_name
            line_number = frame.f_lineno
            
            # Only trace our code
            if 'xtouch' in filename or 'simulation' in filename:
                self.logger.debug(f"TRACE: {filename}:{line_number} {function_name}()")
        
        return self._trace_function
    
    def set_breakpoint(self, filename: str, line_number: int):
        """Set a breakpoint for debugging"""
        breakpoint_id = f"{filename}:{line_number}"
        self.breakpoints.add(breakpoint_id)
        self.logger.info(f"Breakpoint set at {breakpoint_id}")
    
    def check_breakpoint(self, filename: str, line_number: int):
        """Check if execution should break at this point"""
        breakpoint_id = f"{filename}:{line_number}"
        return breakpoint_id in self.breakpoints
    
    def analyze_performance_bottlenecks(self, collector: PerformanceCollector):
        """Analyze performance bottlenecks"""
        process_metrics = collector.get_process_metrics()
        
        # Find high CPU processes
        high_cpu_processes = [
            proc for proc in process_metrics.values() 
            if proc.cpu_percent > 20
        ]
        
        # Find high memory processes
        high_memory_processes = [
            proc for proc in process_metrics.values() 
            if proc.memory_mb > 100
        ]
        
        analysis = {
            "high_cpu_processes": [
                {"name": proc.name, "pid": proc.pid, "cpu_percent": proc.cpu_percent}
                for proc in high_cpu_processes
            ],
            "high_memory_processes": [
                {"name": proc.name, "pid": proc.pid, "memory_mb": proc.memory_mb}
                for proc in high_memory_processes
            ],
            "total_processes": len(process_metrics),
            "recommendations": []
        }
        
        if high_cpu_processes:
            analysis["recommendations"].append("Consider optimizing high CPU processes")
        
        if high_memory_processes:
            analysis["recommendations"].append("Monitor memory usage of large processes")
        
        return analysis

async def main():
    """Main entry point for performance monitoring"""
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('performance_monitor.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Create components
    collector = PerformanceCollector(collection_interval=5.0)
    analyzer = PerformanceAnalyzer(collector)
    dashboard = PerformanceDashboard(collector, analyzer, port=8090)
    debug_toolkit = DebugToolkit()
    
    # Start collection
    collector.start_collection()
    
    # Start web dashboard
    await dashboard.start_server()
    
    # Enable memory profiling
    debug_toolkit.enable_memory_profiling()
    
    logger = logging.getLogger("PerformanceMonitor")
    logger.info("Performance monitoring started")
    logger.info("Dashboard available at http://localhost:8090")
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(10)
            
            # Generate periodic reports
            if int(time.time()) % 300 == 0:  # Every 5 minutes
                report = analyzer.generate_performance_report(duration_minutes=60)
                logger.info(f"Performance Report:\n{report}")
    
    except KeyboardInterrupt:
        logger.info("Shutting down performance monitor...")
    finally:
        collector.stop_collection()

if __name__ == "__main__":
    asyncio.run(main())