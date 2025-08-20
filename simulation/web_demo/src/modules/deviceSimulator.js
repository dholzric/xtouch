/**
 * @file deviceSimulator.js
 * 3D Device simulation using Three.js
 */

export class DeviceSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.deviceMesh = null;
        this.displayMesh = null;
        this.isInitialized = false;
        this.animationId = null;
        
        // Status indicators
        this.statusLights = {
            power: null,
            wifi: null,
            battery: null
        };
        
        // Animation state
        this.rotation = { x: 0, y: 0 };
        this.autoRotate = true;
    }
    
    async init() {
        try {
            // Simple initialization - use existing HTML structure
            this.isInitialized = true;
            console.log('DeviceSimulator initialized (using existing HTML structure)');
            
        } catch (error) {
            console.error('Failed to initialize DeviceSimulator:', error);
            throw error;
        }
    }
    
    initFallback2D() {
        // Create 2D representation when Three.js is not available
        this.container.innerHTML = `
            <div class="device-2d">
                <div class="esp32-board">
                    <div class="display-area">
                        <div class="screen-content" id="device-screen">
                            <div class="boot-logo">XTouch</div>
                        </div>
                    </div>
                    <div class="status-indicators">
                        <div class="status-led power" title="Power"></div>
                        <div class="status-led wifi" title="WiFi"></div>
                        <div class="status-led battery" title="Battery"></div>
                    </div>
                    <div class="touch-layer" id="touch-layer"></div>
                </div>
            </div>
        `;
        
        // Add CSS for 2D device
        const style = document.createElement('style');
        style.textContent = `
            .device-2d {
                width: 100%;
                height: 400px;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                border-radius: 10px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            
            .esp32-board {
                width: 200px;
                height: 300px;
                background: #2d5a2d;
                border-radius: 8px;
                position: relative;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.3);
                border: 2px solid #3a6b3a;
            }
            
            .display-area {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                height: 200px;
                background: #000;
                border-radius: 4px;
                border: 2px solid #333;
                overflow: hidden;
            }
            
            .screen-content {
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #001122, #003366);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .boot-logo {
                color: #00ff88;
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 0 0 10px #00ff88;
                animation: pulse 2s infinite;
            }
            
            .status-indicators {
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                display: flex;
                justify-content: space-around;
            }
            
            .status-led {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #333;
                transition: all 0.3s ease;
            }
            
            .status-led.power.active { background: #00ff00; box-shadow: 0 0 10px #00ff00; }
            .status-led.wifi.active { background: #0088ff; box-shadow: 0 0 10px #0088ff; }
            .status-led.battery.active { background: #ff8800; box-shadow: 0 0 10px #ff8800; }
            
            .touch-layer {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                height: 200px;
                cursor: pointer;
                z-index: 10;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
        
        // Initialize status LEDs
        this.statusLights.power = this.container.querySelector('.status-led.power');
        this.statusLights.wifi = this.container.querySelector('.status-led.wifi');
        this.statusLights.battery = this.container.querySelector('.status-led.battery');
        
        // Set initial states
        this.updateStatusLED('power', true);
        this.updateStatusLED('wifi', true);
        this.updateStatusLED('battery', true);
        
        this.isInitialized = true;
        console.log('DeviceSimulator initialized with 2D fallback');
    }
    
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    createScene() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }
    
    createDeviceMesh() {
        // Create PCB geometry
        const pcbGeometry = new THREE.BoxGeometry(2, 3, 0.1);
        const pcbMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a2d });
        this.deviceMesh = new THREE.Mesh(pcbGeometry, pcbMaterial);
        this.deviceMesh.castShadow = true;
        this.scene.add(this.deviceMesh);
        
        // Create display
        const displayGeometry = new THREE.PlaneGeometry(1.6, 2.2);
        const displayMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000066,
            transparent: true,
            opacity: 0.9
        });
        this.displayMesh = new THREE.Mesh(displayGeometry, displayMaterial);
        this.displayMesh.position.z = 0.06;
        this.deviceMesh.add(this.displayMesh);
        
        // Create status LEDs
        this.createStatusLEDs();
    }
    
    createStatusLEDs() {
        const ledGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        
        // Power LED
        const powerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.statusLights.power = new THREE.Mesh(ledGeometry, powerMaterial);
        this.statusLights.power.position.set(-0.7, -1.2, 0.06);
        this.deviceMesh.add(this.statusLights.power);
        
        // WiFi LED
        const wifiMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff });
        this.statusLights.wifi = new THREE.Mesh(ledGeometry, wifiMaterial);
        this.statusLights.wifi.position.set(0, -1.2, 0.06);
        this.deviceMesh.add(this.statusLights.wifi);
        
        // Battery LED
        const batteryMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
        this.statusLights.battery = new THREE.Mesh(ledGeometry, batteryMaterial);
        this.statusLights.battery.position.set(0.7, -1.2, 0.06);
        this.deviceMesh.add(this.statusLights.battery);
    }
    
    createLighting() {
        // Additional lighting for better visibility
        const pointLight = new THREE.PointLight(0xffffff, 0.3);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
    }
    
    createControls() {
        // Simple mouse controls for rotation
        let isRotating = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', () => {
            isRotating = true;
            this.autoRotate = false;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isRotating = false;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isRotating) return;
            
            const deltaMove = {
                x: event.offsetX - previousMousePosition.x,
                y: event.offsetY - previousMousePosition.y
            };
            
            this.rotation.y += deltaMove.x * 0.01;
            this.rotation.x += deltaMove.y * 0.01;
            
            // Limit rotation
            this.rotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotation.x));
            
            previousMousePosition = { x: event.offsetX, y: event.offsetY };
        });
        
        // Double click to reset
        this.renderer.domElement.addEventListener('dblclick', () => {
            this.rotation = { x: 0, y: 0 };
            this.autoRotate = true;
        });
    }
    
    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            if (this.deviceMesh) {
                if (this.autoRotate) {
                    this.rotation.y += 0.005;
                }
                
                this.deviceMesh.rotation.x = this.rotation.x;
                this.deviceMesh.rotation.y = this.rotation.y;
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }
    
    updateStatusLED(type, active) {
        if (!this.statusLights[type]) return;
        
        if (this.statusLights[type].material) {
            // 3D mode
            this.statusLights[type].material.emissive.setHex(active ? 
                (type === 'power' ? 0x004400 : type === 'wifi' ? 0x002244 : 0x442200) : 0x000000);
        } else {
            // 2D mode
            this.statusLights[type].classList.toggle('active', active);
        }
    }
    
    updateDisplay(content) {
        const screenElement = document.getElementById('device-screen');
        if (screenElement) {
            screenElement.innerHTML = content;
        }
        
        // In 3D mode, could update texture here
        if (this.displayMesh && this.displayMesh.material) {
            // Update display texture (placeholder)
            console.log('Updating 3D display content');
        }
    }
    
    showBootSequence() {
        this.updateDisplay(`
            <div class="boot-sequence">
                <div class="boot-logo">XTouch</div>
                <div class="boot-text">ESP32-2432S028R</div>
                <div class="boot-status">Initializing audio...</div>
            </div>
        `);
        
        // Animate boot sequence
        setTimeout(() => {
            this.updateDisplay(`
                <div class="boot-sequence">
                    <div class="boot-logo">XTouch</div>
                    <div class="boot-text">WIHZI ZK-1001B</div>
                    <div class="boot-status">Ready ✓</div>
                </div>
            `);
        }, 2000);
    }
    
    handleResize() {
        if (!this.renderer || !this.camera) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        console.log('DeviceSimulator resized');
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        console.log('DeviceSimulator destroyed');
    }
    
    getState() {
        return {
            isInitialized: this.isInitialized,
            rotation: this.rotation,
            autoRotate: this.autoRotate,
            statusLights: {
                power: this.statusLights.power ? true : false,
                wifi: this.statusLights.wifi ? true : false,
                battery: this.statusLights.battery ? true : false
            }
        };
    }
}