#!/bin/bash
# xtouch Development Server - Hot Reload Environment

set -e

# Configuration
WORKSPACE=${WORKSPACE:-/workspace}
LOG_FILE="$WORKSPACE/dev_server.log"
PID_FILE="$WORKSPACE/dev_server.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log "Cleaning up development server..."
    
    # Kill background processes
    if [[ -f "$PID_FILE" ]]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                log "Stopping process $pid"
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Kill any remaining processes
    pkill -f "hot_reload.py" 2>/dev/null || true
    pkill -f "build_watcher.py" 2>/dev/null || true
    pkill -f "test_automation.py" 2>/dev/null || true
    
    log "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if workspace exists
    if [[ ! -d "$WORKSPACE" ]]; then
        error "Workspace directory not found: $WORKSPACE"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 not found"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found"
        exit 1
    fi
    
    # Check PlatformIO
    if ! command -v pio &> /dev/null; then
        warn "PlatformIO not found in PATH, trying to initialize..."
        export PATH="$PATH:$HOME/.platformio/penv/bin"
        if ! command -v pio &> /dev/null; then
            error "PlatformIO not available"
            exit 1
        fi
    fi
    
    log "Prerequisites check completed"
}

# Initialize development environment
init_environment() {
    log "Initializing development environment..."
    
    cd "$WORKSPACE"
    
    # Create necessary directories
    mkdir -p build
    mkdir -p logs
    mkdir -p test-results
    
    # Initialize PlatformIO if needed
    if [[ ! -d ".pio" ]]; then
        log "Initializing PlatformIO environment..."
        pio project init --board esp32dev
    fi
    
    # Install Python dependencies for simulation
    if [[ -f "simulation/requirements.txt" ]]; then
        log "Installing Python dependencies..."
        pip3 install -r simulation/requirements.txt
    fi
    
    # Build LVGL simulator if needed
    if [[ ! -f "simulation/lvgl_pc/build/xtouch_lvgl_simulator" ]]; then
        log "Building LVGL simulator..."
        cd simulation/lvgl_pc
        mkdir -p build
        cd build
        cmake .. && make -j$(nproc) || warn "LVGL simulator build failed"
        cd "$WORKSPACE"
    fi
    
    # Build audio simulator if needed
    if [[ ! -f "simulation/audio_desktop/build/xtouch_audio_simulator" ]]; then
        log "Building audio simulator..."
        cd simulation/audio_desktop
        mkdir -p build
        cd build
        cmake .. && make -j$(nproc) || warn "Audio simulator build failed"
        cd "$WORKSPACE"
    fi
    
    # Install web demo dependencies
    if [[ -f "simulation/web_demo/package.json" ]]; then
        log "Installing web demo dependencies..."
        cd simulation/web_demo
        npm install || warn "Web demo dependency installation failed"
        cd "$WORKSPACE"
    fi
    
    log "Environment initialization completed"
}

# Start hot reload server
start_hot_reload() {
    log "Starting hot reload server..."
    
    cd "$WORKSPACE"
    python3 simulation/dev_environment/scripts/hot_reload.py &
    echo $! >> "$PID_FILE"
    
    # Wait for server to start
    sleep 3
    
    if kill -0 $! 2>/dev/null; then
        log "Hot reload server started (PID: $!)"
    else
        error "Failed to start hot reload server"
        exit 1
    fi
}

# Start file watchers
start_watchers() {
    log "Starting file watchers..."
    
    # Firmware watcher
    cat > "$WORKSPACE/firmware_watcher.py" << 'EOF'
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os

class FirmwareHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_build = 0
        self.build_delay = 2  # seconds
    
    def on_modified(self, event):
        if event.is_directory:
            return
        
        if event.src_path.endswith(('.cpp', '.c', '.h', '.ini')):
            current_time = time.time()
            if current_time - self.last_build > self.build_delay:
                print(f"Building firmware due to change in {event.src_path}")
                try:
                    result = subprocess.run(['pio', 'run'], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        print("Firmware build successful")
                    else:
                        print(f"Firmware build failed: {result.stderr}")
                except Exception as e:
                    print(f"Build error: {e}")
                self.last_build = current_time

if __name__ == "__main__":
    event_handler = FirmwareHandler()
    observer = Observer()
    observer.schedule(event_handler, "/workspace/src", recursive=True)
    observer.schedule(event_handler, "/workspace/platformio.ini", recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
EOF
    
    python3 "$WORKSPACE/firmware_watcher.py" &
    echo $! >> "$PID_FILE"
    log "Firmware watcher started (PID: $!)"
    
    # Web demo watcher (if in development mode)
    if [[ -f "$WORKSPACE/simulation/web_demo/package.json" ]]; then
        cd "$WORKSPACE/simulation/web_demo"
        npm run dev &
        echo $! >> "$PID_FILE"
        log "Web demo dev server started (PID: $!)"
        cd "$WORKSPACE"
    fi
}

# Start test automation
start_test_automation() {
    log "Starting test automation..."
    
    cat > "$WORKSPACE/test_automation.py" << 'EOF'
import time
import subprocess
import threading
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.last_test_run = {}
        self.test_delay = 10  # seconds between test runs
    
    def run_tests(self, component):
        current_time = time.time()
        if current_time - self.last_test_run.get(component, 0) < self.test_delay:
            return
        
        print(f"Running tests for {component}")
        try:
            result = subprocess.run([
                'python3', 'simulation/test_scenarios/test_framework.py',
                '--simulators', component
            ], capture_output=True, text=True, cwd='/workspace')
            
            if result.returncode == 0:
                print(f"Tests passed for {component}")
            else:
                print(f"Tests failed for {component}: {result.stderr}")
                
        except Exception as e:
            print(f"Test execution error: {e}")
        
        self.last_test_run[component] = current_time
    
    def continuous_testing(self):
        while True:
            time.sleep(30)  # Run tests every 30 seconds
            for component in ['wokwi', 'lvgl', 'audio']:
                if Path(f'/workspace/simulation/{component}').exists():
                    threading.Thread(target=self.run_tests, args=[component]).start()

if __name__ == "__main__":
    runner = TestRunner()
    try:
        runner.continuous_testing()
    except KeyboardInterrupt:
        print("Test automation stopped")
EOF
    
    python3 "$WORKSPACE/test_automation.py" &
    echo $! >> "$PID_FILE"
    log "Test automation started (PID: $!)"
}

# Start development dashboard
start_dashboard() {
    log "Starting development dashboard..."
    
    # Create simple web dashboard
    cat > "$WORKSPACE/dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>xtouch Development Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .status-card { background: #2d2d2d; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
        .status-card h3 { margin-top: 0; color: #007acc; }
        .status-good { border-left-color: #28a745; }
        .status-warning { border-left-color: #ffc107; }
        .status-error { border-left-color: #dc3545; }
        .log-output { background: #000; color: #0f0; padding: 15px; border-radius: 4px; font-family: monospace; height: 200px; overflow-y: auto; }
        button { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #005a9e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>xtouch Development Dashboard</h1>
        
        <div class="status-grid">
            <div class="status-card status-good">
                <h3>Hot Reload Server</h3>
                <p>Status: <span id="reload-status">Running</span></p>
                <p>Connected Clients: <span id="client-count">0</span></p>
                <button onclick="triggerBuild('firmware')">Build Firmware</button>
            </div>
            
            <div class="status-card status-good">
                <h3>Simulators</h3>
                <p>LVGL: <span id="lvgl-status">Ready</span></p>
                <p>Audio: <span id="audio-status">Ready</span></p>
                <p>Web Demo: <span id="web-status">Running</span></p>
                <button onclick="runTests()">Run All Tests</button>
            </div>
            
            <div class="status-card">
                <h3>Build History</h3>
                <div id="build-history">
                    <p>No recent builds</p>
                </div>
            </div>
            
            <div class="status-card">
                <h3>Test Results</h3>
                <div id="test-results">
                    <p>No recent test runs</p>
                </div>
            </div>
        </div>
        
        <h2>Live Logs</h2>
        <div class="log-output" id="log-output">
            Connecting to hot reload server...
        </div>
    </div>
    
    <script>
        let ws;
        let logs = [];
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8765');
            
            ws.onopen = function() {
                addLog('Connected to hot reload server');
                updateStatus();
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
            
            ws.onclose = function() {
                addLog('Disconnected from hot reload server');
                setTimeout(connectWebSocket, 5000);
            };
        }
        
        function handleMessage(data) {
            switch(data.type) {
                case 'build_complete':
                    addLog(`Build ${data.component}: ${data.status} (${data.duration.toFixed(1)}s)`);
                    updateBuildHistory(data);
                    break;
                case 'file_change':
                    addLog(`File changed in ${data.component}: ${data.files.length} files`);
                    break;
                case 'status_response':
                    updateDashboard(data);
                    break;
            }
        }
        
        function addLog(message) {
            const timestamp = new Date().toLocaleTimeString();
            logs.push(`[${timestamp}] ${message}`);
            if (logs.length > 100) logs.shift();
            
            const logOutput = document.getElementById('log-output');
            logOutput.textContent = logs.join('\n');
            logOutput.scrollTop = logOutput.scrollHeight;
        }
        
        function updateStatus() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'get_status'}));
            }
        }
        
        function triggerBuild(component) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'trigger_build', component: component}));
            }
        }
        
        function runTests() {
            addLog('Triggering test run...');
            // Implementation would trigger test automation
        }
        
        function updateDashboard(data) {
            document.getElementById('client-count').textContent = data.connected_clients;
            // Update other status indicators
        }
        
        function updateBuildHistory(data) {
            // Update build history display
        }
        
        // Initialize
        connectWebSocket();
        setInterval(updateStatus, 10000);
    </script>
</body>
</html>
EOF
    
    # Start simple HTTP server for dashboard
    cd "$WORKSPACE"
    python3 -m http.server 8000 &
    echo $! >> "$PID_FILE"
    log "Development dashboard started at http://localhost:8000/dashboard.html (PID: $!)"
}

# Show status information
show_status() {
    echo -e "\n${GREEN}=== xtouch Development Environment Status ===${NC}"
    echo -e "${BLUE}Workspace:${NC} $WORKSPACE"
    echo -e "${BLUE}Log file:${NC} $LOG_FILE"
    echo -e "${BLUE}PID file:${NC} $PID_FILE"
    
    if [[ -f "$PID_FILE" ]]; then
        echo -e "\n${BLUE}Running processes:${NC}"
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} PID $pid"
            else
                echo -e "  ${RED}✗${NC} PID $pid (dead)"
            fi
        done < "$PID_FILE"
    else
        echo -e "\n${YELLOW}No processes running${NC}"
    fi
    
    echo -e "\n${BLUE}Services:${NC}"
    echo -e "  Hot Reload Server: ws://localhost:8765"
    echo -e "  Development Dashboard: http://localhost:8000/dashboard.html"
    echo -e "  Web Demo: http://localhost:3000"
    echo -e "  LVGL Simulator: Display on :1 (VNC port 5900)"
    
    echo -e "\n${BLUE}Commands:${NC}"
    echo -e "  ${YELLOW}pio run${NC}                 - Build firmware"
    echo -e "  ${YELLOW}make -C simulation/lvgl_pc/build${NC} - Build LVGL simulator"
    echo -e "  ${YELLOW}python3 test_framework.py${NC} - Run tests"
    echo -e "  ${YELLOW}kill \$(cat $PID_FILE)${NC}    - Stop all services"
    echo ""
}

# Main function
main() {
    log "Starting xtouch development server..."
    
    # Parse command line arguments
    case "${1:-start}" in
        start)
            check_prerequisites
            init_environment
            start_hot_reload
            start_watchers
            start_test_automation
            start_dashboard
            show_status
            
            log "Development environment is ready!"
            log "Press Ctrl+C to stop all services"
            
            # Keep the script running
            while true; do
                sleep 10
                # Check if any processes died and restart if needed
                if [[ -f "$PID_FILE" ]]; then
                    while read -r pid; do
                        if ! kill -0 "$pid" 2>/dev/null; then
                            warn "Process $pid died, consider restarting"
                        fi
                    done < "$PID_FILE"
                fi
            done
            ;;
        
        stop)
            cleanup
            ;;
        
        status)
            show_status
            ;;
        
        restart)
            cleanup
            sleep 2
            exec "$0" start
            ;;
        
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            echo ""
            echo "Commands:"
            echo "  start   - Start development environment"
            echo "  stop    - Stop all services"
            echo "  status  - Show status information"
            echo "  restart - Restart all services"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"