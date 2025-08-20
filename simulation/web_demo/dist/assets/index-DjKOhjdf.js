(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function e(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=e(s);fetch(s.href,a)}})();class y{constructor(){this.audioContext=null,this.audioBuffer=null,this.sourceNode=null,this.gainNode=null,this.analyserNode=null,this.equalizerNodes=[],this.isInitialized=!1,this.isLoaded=!1,this.isPlaying=!1,this.startTime=0,this.pauseTime=0,this.playbackRate=1,this.debugMode=!1,this.equalizerFreqs=[60,170,310,600,1e3,3e3,6e3,12e3,14e3,16e3],this.presets={flat:[0,0,0,0,0,0,0,0,0,0],rock:[4,2,-1,-1,1,2,3,3,2,1],pop:[1,2,3,2,-1,-1,1,2,3,2],jazz:[2,1,0,1,2,2,1,1,2,2],classical:[3,2,1,0,0,0,1,2,3,3],electronic:[3,2,0,-1,1,2,3,3,2,1]}}async init(){try{this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.audioContext.state==="suspended"&&await this.audioContext.resume(),this.gainNode=this.audioContext.createGain(),this.analyserNode=this.audioContext.createAnalyser(),this.analyserNode.fftSize=2048,this.analyserNode.smoothingTimeConstant=.85,this.createEqualizer(),this.connectAudioGraph(),this.isInitialized=!0,console.log("AudioEngine initialized")}catch(t){throw console.error("Failed to initialize AudioEngine:",t),t}}createEqualizer(){this.equalizerNodes=[];for(let t=0;t<this.equalizerFreqs.length;t++){const e=this.audioContext.createBiquadFilter();e.type="peaking",e.frequency.value=this.equalizerFreqs[t],e.Q.value=1,e.gain.value=0,this.equalizerNodes.push(e)}}connectAudioGraph(){for(let e=0;e<this.equalizerNodes.length;e++)e!==0&&this.equalizerNodes[e-1].connect(this.equalizerNodes[e]);const t=this.equalizerNodes[this.equalizerNodes.length-1];t.connect(this.gainNode),t.connect(this.analyserNode),this.gainNode.connect(this.audioContext.destination)}async loadFromBuffer(t,e="Unknown",i="Unknown"){try{const n=t.length/2;this.audioBuffer=this.audioContext.createBuffer(2,n,44100);for(let o=0;o<2;o++){const r=this.audioBuffer.getChannelData(o);for(let l=0;l<n;l++)r[l]=t[l*2+o]}this.trackInfo={title:e,artist:i},this.isLoaded=!0,console.log("Audio loaded from buffer")}catch(s){throw console.error("Failed to load audio from buffer:",s),s}}async loadFromFile(t,e){try{this.audioBuffer=await this.audioContext.decodeAudioData(t),this.trackInfo={title:e.replace(/\.[^/.]+$/,""),artist:"User Upload"},this.isLoaded=!0,console.log("Audio loaded from file")}catch(i){throw console.error("Failed to load audio from file:",i),i}}play(){if(!this.isLoaded||this.isPlaying)return;this.sourceNode=this.audioContext.createBufferSource(),this.sourceNode.buffer=this.audioBuffer,this.sourceNode.playbackRate.value=this.playbackRate,this.sourceNode.connect(this.equalizerNodes[0]),this.sourceNode.onended=()=>{this.isPlaying=!1,this.startTime=0,this.pauseTime=0};const t=this.pauseTime;this.sourceNode.start(0,t),this.startTime=this.audioContext.currentTime-t,this.isPlaying=!0,console.log("Playback started")}pause(){this.isPlaying&&(this.pauseTime=this.audioContext.currentTime-this.startTime,this.sourceNode.stop(),this.isPlaying=!1,console.log("Playback paused"))}stop(){this.sourceNode&&this.sourceNode.stop(),this.isPlaying=!1,this.startTime=0,this.pauseTime=0,console.log("Playback stopped")}setVolume(t){this.gainNode&&(this.gainNode.gain.value=Math.max(0,Math.min(1,t)))}getVolume(){return this.gainNode?this.gainNode.gain.value:0}getCurrentTime(){return this.isPlaying?this.audioContext.currentTime-this.startTime:this.pauseTime}getDuration(){return this.audioBuffer?this.audioBuffer.duration:0}setPlaybackRate(t){this.playbackRate=t,this.sourceNode&&(this.sourceNode.playbackRate.value=t)}applyEqualizerPreset(t){const e=this.presets[t];if(e){for(let i=0;i<e.length&&i<this.equalizerNodes.length;i++)this.equalizerNodes[i].gain.value=e[i];console.log(`Applied equalizer preset: ${t}`)}}setEqualizerBand(t,e){t>=0&&t<this.equalizerNodes.length&&(this.equalizerNodes[t].gain.value=e)}getEqualizerBand(t){return t>=0&&t<this.equalizerNodes.length?this.equalizerNodes[t].gain.value:0}updateVisualizer(){if(!this.analyserNode)return null;const t=this.analyserNode.frequencyBinCount,e=new Uint8Array(t);return this.analyserNode.getByteFrequencyData(e),e}getSpectrumData(){const t=this.updateVisualizer();if(!t)return null;const e=10,i=Math.floor(t.length/e),s=[];for(let a=0;a<e;a++){let n=0;for(let o=0;o<i;o++)n+=t[a*i+o];s.push(n/i/255)}return s}enableDebugMode(t){this.debugMode=t,console.log(`Debug mode ${t?"enabled":"disabled"}`)}getState(){return{isInitialized:this.isInitialized,isLoaded:this.isLoaded,isPlaying:this.isPlaying,currentTime:this.getCurrentTime(),duration:this.getDuration(),volume:this.getVolume(),playbackRate:this.playbackRate,trackInfo:this.trackInfo}}isLoaded(){return this.isLoaded}handleResize(){console.log("AudioEngine handling resize")}}class E{constructor(){this.scene=null,this.camera=null,this.renderer=null,this.deviceMesh=null,this.displayMesh=null,this.isInitialized=!1,this.animationId=null,this.statusLights={power:null,wifi:null,battery:null},this.rotation={x:0,y:0},this.autoRotate=!0}async init(){try{if(this.container=document.getElementById("device-3d"),!this.container)throw new Error("Device 3D container not found");if(typeof THREE>"u"){console.warn("Three.js not available, using fallback 2D representation"),this.initFallback2D();return}this.initThreeJS(),this.createScene(),this.createDeviceMesh(),this.createLighting(),this.createControls(),this.startAnimation(),this.isInitialized=!0,console.log("DeviceSimulator initialized with 3D")}catch(t){console.warn("3D initialization failed, using 2D fallback:",t),this.initFallback2D()}}initFallback2D(){this.container.innerHTML=`
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
        `;const t=document.createElement("style");t.textContent=`
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
        `,document.head.appendChild(t),this.statusLights.power=this.container.querySelector(".status-led.power"),this.statusLights.wifi=this.container.querySelector(".status-led.wifi"),this.statusLights.battery=this.container.querySelector(".status-led.battery"),this.updateStatusLED("power",!0),this.updateStatusLED("wifi",!0),this.updateStatusLED("battery",!0),this.isInitialized=!0,console.log("DeviceSimulator initialized with 2D fallback")}initThreeJS(){this.scene=new THREE.Scene,this.scene.background=new THREE.Color(1710618),this.camera=new THREE.PerspectiveCamera(75,this.container.clientWidth/this.container.clientHeight,.1,1e3),this.camera.position.set(0,0,5),this.renderer=new THREE.WebGLRenderer({antialias:!0}),this.renderer.setSize(this.container.clientWidth,this.container.clientHeight),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=THREE.PCFSoftShadowMap,this.container.appendChild(this.renderer.domElement)}createScene(){const t=new THREE.AmbientLight(4210752,.4);this.scene.add(t);const e=new THREE.DirectionalLight(16777215,.6);e.position.set(10,10,5),e.castShadow=!0,this.scene.add(e)}createDeviceMesh(){const t=new THREE.BoxGeometry(2,3,.1),e=new THREE.MeshLambertMaterial({color:2972205});this.deviceMesh=new THREE.Mesh(t,e),this.deviceMesh.castShadow=!0,this.scene.add(this.deviceMesh);const i=new THREE.PlaneGeometry(1.6,2.2),s=new THREE.MeshBasicMaterial({color:102,transparent:!0,opacity:.9});this.displayMesh=new THREE.Mesh(i,s),this.displayMesh.position.z=.06,this.deviceMesh.add(this.displayMesh),this.createStatusLEDs()}createStatusLEDs(){const t=new THREE.SphereGeometry(.03,8,8),e=new THREE.MeshBasicMaterial({color:65280});this.statusLights.power=new THREE.Mesh(t,e),this.statusLights.power.position.set(-.7,-1.2,.06),this.deviceMesh.add(this.statusLights.power);const i=new THREE.MeshBasicMaterial({color:35071});this.statusLights.wifi=new THREE.Mesh(t,i),this.statusLights.wifi.position.set(0,-1.2,.06),this.deviceMesh.add(this.statusLights.wifi);const s=new THREE.MeshBasicMaterial({color:16746496});this.statusLights.battery=new THREE.Mesh(t,s),this.statusLights.battery.position.set(.7,-1.2,.06),this.deviceMesh.add(this.statusLights.battery)}createLighting(){const t=new THREE.PointLight(16777215,.3);t.position.set(0,0,10),this.scene.add(t)}createControls(){let t=!1,e={x:0,y:0};this.renderer.domElement.addEventListener("mousedown",()=>{t=!0,this.autoRotate=!1}),this.renderer.domElement.addEventListener("mouseup",()=>{t=!1}),this.renderer.domElement.addEventListener("mousemove",i=>{if(!t)return;const s={x:i.offsetX-e.x,y:i.offsetY-e.y};this.rotation.y+=s.x*.01,this.rotation.x+=s.y*.01,this.rotation.x=Math.max(-Math.PI/3,Math.min(Math.PI/3,this.rotation.x)),e={x:i.offsetX,y:i.offsetY}}),this.renderer.domElement.addEventListener("dblclick",()=>{this.rotation={x:0,y:0},this.autoRotate=!0})}startAnimation(){const t=()=>{this.animationId=requestAnimationFrame(t),this.deviceMesh&&(this.autoRotate&&(this.rotation.y+=.005),this.deviceMesh.rotation.x=this.rotation.x,this.deviceMesh.rotation.y=this.rotation.y),this.renderer&&this.scene&&this.camera&&this.renderer.render(this.scene,this.camera)};t()}updateStatusLED(t,e){this.statusLights[t]&&(this.statusLights[t].material?this.statusLights[t].material.emissive.setHex(e?t==="power"?17408:t==="wifi"?8772:4465152:0):this.statusLights[t].classList.toggle("active",e))}updateDisplay(t){const e=document.getElementById("device-screen");e&&(e.innerHTML=t),this.displayMesh&&this.displayMesh.material&&console.log("Updating 3D display content")}showBootSequence(){this.updateDisplay(`
            <div class="boot-sequence">
                <div class="boot-logo">XTouch</div>
                <div class="boot-text">ESP32-2432S028R</div>
                <div class="boot-status">Initializing audio...</div>
            </div>
        `),setTimeout(()=>{this.updateDisplay(`
                <div class="boot-sequence">
                    <div class="boot-logo">XTouch</div>
                    <div class="boot-text">WIHZI ZK-1001B</div>
                    <div class="boot-status">Ready ✓</div>
                </div>
            `)},2e3)}handleResize(){if(!this.renderer||!this.camera)return;const t=this.container.clientWidth,e=this.container.clientHeight;this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.renderer.setSize(t,e),console.log("DeviceSimulator resized")}destroy(){this.animationId&&cancelAnimationFrame(this.animationId),this.renderer&&this.container.removeChild(this.renderer.domElement),console.log("DeviceSimulator destroyed")}getState(){return{isInitialized:this.isInitialized,rotation:this.rotation,autoRotate:this.autoRotate,statusLights:{power:!!this.statusLights.power,wifi:!!this.statusLights.wifi,battery:!!this.statusLights.battery}}}}class w{constructor(){this.currentScreen="intro",this.screenHistory=[],this.isInitialized=!1,this.screens={},this.animations=!0}async init(){try{this.initializeScreens(),this.showScreen("intro"),this.isInitialized=!0,console.log("UISimulator initialized")}catch(t){throw console.error("Failed to initialize UISimulator:",t),t}}initializeScreens(){this.screens={intro:this.createIntroScreen(),home:this.createHomeScreen(),equalizer:this.createEqualizerScreen(),settings:this.createSettingsScreen(),info:this.createInfoScreen()}}createIntroScreen(){return`
            <div class="screen intro-screen">
                <div class="intro-content">
                    <div class="logo-section">
                        <div class="xtouch-logo">XTouch</div>
                        <div class="boombox-subtitle">Boombox Edition</div>
                    </div>
                    <div class="boot-info">
                        <div class="hardware-info">ESP32-2432S028R</div>
                        <div class="amplifier-info">WIHZI ZK-1001B</div>
                        <div class="status-info">Initializing...</div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `}createHomeScreen(){return`
            <div class="screen home-screen">
                <div class="status-bar">
                    <div class="time">12:34</div>
                    <div class="status-icons">
                        <span class="wifi-status">📶</span>
                        <span class="battery">🔋</span>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="track-info">
                        <div class="track-title">Demo Track</div>
                        <div class="track-artist">xtouch Simulator</div>
                    </div>
                    
                    <div class="album-art">
                        <div class="album-placeholder">🎵</div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="time-display">
                            <span id="current-time">0:00</span>
                            <span id="total-time">3:45</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="controls">
                        <button class="control-btn" id="prev-btn">⏮</button>
                        <button class="control-btn play-btn" id="play-btn">▶</button>
                        <button class="control-btn" id="next-btn">⏭</button>
                    </div>
                    
                    <div class="volume-section">
                        <span class="volume-icon">🔊</span>
                        <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="70">
                        <span class="volume-value" id="volume-value">70%</span>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn active" data-screen="home">Home</button>
                    <button class="tab-btn" data-screen="equalizer">EQ</button>
                    <button class="tab-btn" data-screen="settings">Settings</button>
                </div>
            </div>
        `}createEqualizerScreen(){return`
            <div class="screen equalizer-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>Equalizer</h2>
                </div>
                
                <div class="eq-content">
                    <div class="eq-presets">
                        <button class="preset-btn active" data-preset="flat">Flat</button>
                        <button class="preset-btn" data-preset="rock">Rock</button>
                        <button class="preset-btn" data-preset="pop">Pop</button>
                        <button class="preset-btn" data-preset="jazz">Jazz</button>
                        <button class="preset-btn" data-preset="classical">Classical</button>
                        <button class="preset-btn" data-preset="electronic">Electronic</button>
                    </div>
                    
                    <div class="eq-bands">
                        <div class="band">
                            <div class="freq-label">60Hz</div>
                            <input type="range" class="eq-slider" data-band="0" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">170Hz</div>
                            <input type="range" class="eq-slider" data-band="1" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">310Hz</div>
                            <input type="range" class="eq-slider" data-band="2" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">600Hz</div>
                            <input type="range" class="eq-slider" data-band="3" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">1kHz</div>
                            <input type="range" class="eq-slider" data-band="4" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">3kHz</div>
                            <input type="range" class="eq-slider" data-band="5" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">6kHz</div>
                            <input type="range" class="eq-slider" data-band="6" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">12kHz</div>
                            <input type="range" class="eq-slider" data-band="7" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">14kHz</div>
                            <input type="range" class="eq-slider" data-band="8" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">16kHz</div>
                            <input type="range" class="eq-slider" data-band="9" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                    </div>
                    
                    <div class="eq-visualizer">
                        <canvas class="spectrum-canvas" width="200" height="60"></canvas>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn" data-screen="home">Home</button>
                    <button class="tab-btn active" data-screen="equalizer">EQ</button>
                    <button class="tab-btn" data-screen="settings">Settings</button>
                </div>
            </div>
        `}createSettingsScreen(){return`
            <div class="screen settings-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>Settings</h2>
                </div>
                
                <div class="settings-content">
                    <div class="setting-group">
                        <h3>Audio</h3>
                        <div class="setting-item">
                            <label>Master Volume</label>
                            <input type="range" id="master-volume" min="0" max="100" value="70">
                            <span id="master-volume-value">70%</span>
                        </div>
                        <div class="setting-item">
                            <label>Bass Boost</label>
                            <input type="range" min="0" max="10" value="0">
                            <span>0dB</span>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>Display</h3>
                        <div class="setting-item">
                            <label>Brightness</label>
                            <input type="range" min="10" max="100" value="80">
                            <span>80%</span>
                        </div>
                        <div class="setting-item">
                            <label>Screen Timeout</label>
                            <select>
                                <option>30 seconds</option>
                                <option>1 minute</option>
                                <option selected>2 minutes</option>
                                <option>Never</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>System</h3>
                        <div class="setting-item">
                            <label>WiFi</label>
                            <button class="toggle-btn active">ON</button>
                        </div>
                        <div class="setting-item">
                            <label>Auto-Sleep</label>
                            <button class="toggle-btn">OFF</button>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>About</h3>
                        <div class="info-item">
                            <label>Model</label>
                            <span>ESP32-2432S028R</span>
                        </div>
                        <div class="info-item">
                            <label>Amplifier</label>
                            <span>WIHZI ZK-1001B</span>
                        </div>
                        <div class="info-item">
                            <label>Firmware</label>
                            <span>v1.0.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn" data-screen="home">Home</button>
                    <button class="tab-btn" data-screen="equalizer">EQ</button>
                    <button class="tab-btn active" data-screen="settings">Settings</button>
                </div>
            </div>
        `}createInfoScreen(){return`
            <div class="screen info-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>System Info</h2>
                </div>
                
                <div class="info-content">
                    <div class="system-stats">
                        <div class="stat-item">
                            <label>CPU Usage</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 25%"></div>
                            </div>
                            <span>25%</span>
                        </div>
                        <div class="stat-item">
                            <label>Memory</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 40%"></div>
                            </div>
                            <span>126KB / 320KB</span>
                        </div>
                        <div class="stat-item">
                            <label>Storage</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 60%"></div>
                            </div>
                            <span>2.4MB / 4MB</span>
                        </div>
                    </div>
                    
                    <div class="hardware-info">
                        <h3>Hardware Status</h3>
                        <div class="hw-item">
                            <span class="hw-name">Display</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Touch</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Audio DAC</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Amplifier</span>
                            <span class="hw-status good">✓ Connected</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">SD Card</span>
                            <span class="hw-status good">✓ Mounted</span>
                        </div>
                    </div>
                </div>
            </div>
        `}showScreen(t){if(!this.screens[t]){console.warn(`Screen '${t}' not found`);return}this.currentScreen!==t&&this.screenHistory.push(this.currentScreen),this.currentScreen=t;const e=document.getElementById("device-screen");if(!e){console.warn("Device screen container not found");return}this.animations?(e.style.opacity="0",setTimeout(()=>{e.innerHTML=this.screens[t],e.style.opacity="1",this.onScreenShown(t)},150)):(e.innerHTML=this.screens[t],this.onScreenShown(t)),console.log(`Showing screen: ${t}`)}onScreenShown(t){switch(t){case"intro":this.animateIntroSequence();break;case"equalizer":this.initializeEqualizer();break;case"settings":this.initializeSettings();break}}animateIntroSequence(){let t=0;const e=document.querySelector(".progress-fill"),i=document.querySelector(".status-info"),s=["Initializing...","Loading audio engine...","Connecting amplifier...","Ready!"],a=setInterval(()=>{t+=25,e&&(e.style.width=`${t}%`);const n=Math.floor(t/25)-1;i&&n>=0&&n<s.length&&(i.textContent=s[n]),t>=100&&(clearInterval(a),setTimeout(()=>{this.showScreen("home")},1e3))},800)}initializeEqualizer(){const t=document.querySelector(".spectrum-canvas");t&&this.initializeSpectrum(t),document.querySelectorAll(".eq-slider").forEach(i=>{i.addEventListener("input",s=>{const a=parseInt(s.target.dataset.band),n=parseFloat(s.target.value);this.updateEqualizerBand(a,n)})})}initializeSpectrum(t){const e=t.getContext("2d"),i=t.width,s=t.height,a=()=>{e.clearRect(0,0,i,s);const n=20,o=i/n;for(let r=0;r<n;r++){const l=Math.random()*s*.8,c=r*o;e.fillStyle=`hsl(${120+r*10}, 70%, 50%)`,e.fillRect(c,s-l,o-1,l)}requestAnimationFrame(a)};a()}updateEqualizerBand(t,e){const i=document.querySelector(`[data-band="${t}"]`).parentNode.querySelector(".gain-value");i&&(i.textContent=`${e>0?"+":""}${e}dB`),console.log(`EQ Band ${t}: ${e}dB`)}initializeSettings(){document.querySelectorAll(".toggle-btn").forEach(e=>{e.addEventListener("click",()=>{e.classList.toggle("active"),e.textContent=e.classList.contains("active")?"ON":"OFF"})})}goBack(){if(this.screenHistory.length>0){const t=this.screenHistory.pop();this.showScreen(t)}}getCurrentState(){return{currentScreen:this.currentScreen,screenHistory:[...this.screenHistory],isInitialized:this.isInitialized,animations:this.animations}}setAnimations(t){this.animations=t}}class S{constructor(){this.isRunning=!1,this.stats={fps:0,memory:0,cpu:0,audio:{latency:0,bufferSize:0,dropouts:0}},this.frameCount=0,this.lastTime=0,this.updateInterval=null}init(){console.log("PerformanceMonitor initialized")}start(){this.isRunning=!0,this.lastTime=performance.now(),this.updateInterval=setInterval(()=>{this.updateStats()},1e3),console.log("Performance monitoring started")}stop(){this.isRunning=!1,this.updateInterval&&clearInterval(this.updateInterval),console.log("Performance monitoring stopped")}updateStats(){const t=performance.now();this.stats.fps=Math.round(this.frameCount*1e3/(t-this.lastTime)),this.frameCount=0,this.lastTime=t,this.stats.cpu=Math.random()*30+10,performance.memory?this.stats.memory=Math.round(performance.memory.usedJSHeapSize/1024/1024):this.stats.memory=Math.random()*50+100,this.stats.audio.latency=Math.random()*5+5,this.stats.audio.bufferSize=512,this.stats.audio.dropouts=Math.floor(Math.random()*3)}frame(){this.isRunning&&this.frameCount++}getStats(){return{...this.stats}}}class x{constructor(){this.logs=[],this.maxLogs=100,this.container=null,this.isVisible=!0}init(){this.container=document.getElementById("console-output"),this.container||console.warn("Console output container not found"),console.log("DebugConsole initialized")}log(t,e="info"){const s={timestamp:new Date().toLocaleTimeString(),message:t,level:e,id:Date.now()+Math.random()};this.logs.push(s),this.logs.length>this.maxLogs&&this.logs.shift(),this.updateDisplay(),console[e]?console[e](t):console.log(t)}updateDisplay(){if(!this.container)return;const t=this.logs.map(e=>`<div class="console-line ${e.level}">
                <span class="timestamp">[${e.timestamp}]</span>
                <span class="level">${e.level.toUpperCase()}</span>
                <span class="message">${this.escapeHtml(e.message)}</span>
            </div>`).join("");this.container.innerHTML=t,this.container.scrollTop=this.container.scrollHeight}clear(){this.logs=[],this.updateDisplay()}escapeHtml(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}show(){this.isVisible=!0,this.container&&(this.container.style.display="block")}hide(){this.isVisible=!1,this.container&&(this.container.style.display="none")}toggle(){this.isVisible?this.hide():this.show()}}class k{constructor(){this.isEnabled=!0,this.touchHistory=[],this.maxHistory=50,this.calibration={xMin:0,xMax:240,yMin:0,yMax:320}}init(){console.log("TouchController initialized")}handleTouch(t,e){if(!this.isEnabled)return;const i={x:Math.round(t),y:Math.round(e),timestamp:Date.now()};this.touchHistory.push(i),this.touchHistory.length>this.maxHistory&&this.touchHistory.shift(),this.processTouchInput(i)}processTouchInput(t){const e=this.getTouchedElement(t.x,t.y);e&&(console.log(`Touch detected on: ${e.type} at (${t.x}, ${t.y})`),this.triggerUIAction(e,t))}getTouchedElement(t,e){const i=[{type:"play_button",x1:80,y1:200,x2:160,y2:240},{type:"volume_up",x1:200,y1:100,x2:240,y2:140},{type:"volume_down",x1:200,y1:180,x2:240,y2:220},{type:"eq_button",x1:0,y1:280,x2:80,y2:320},{type:"settings_button",x1:160,y1:280,x2:240,y2:320}];for(const s of i)if(t>=s.x1&&t<=s.x2&&e>=s.y1&&e<=s.y2)return s;return{type:"screen",x:t,y:e}}triggerUIAction(t,e){switch(t.type){case"play_button":this.simulateButtonPress("play-btn");break;case"volume_up":this.adjustVolume(5);break;case"volume_down":this.adjustVolume(-5);break;case"eq_button":this.navigateToScreen("equalizer");break;case"settings_button":this.navigateToScreen("settings");break;default:console.log(`Touch on screen at (${e.x}, ${e.y})`)}}simulateButtonPress(t){const e=document.getElementById(t);e&&(e.click(),e.style.transform="scale(0.95)",setTimeout(()=>{e.style.transform="scale(1)"},100))}adjustVolume(t){const e=document.getElementById("volume-slider");if(e){const i=parseInt(e.value),s=Math.max(0,Math.min(100,i+t));e.value=s,e.dispatchEvent(new Event("input"))}}navigateToScreen(t){const e=document.querySelector(`[data-screen="${t}"]`);e&&e.click()}setEnabled(t){this.isEnabled=t,console.log(`Touch simulation ${t?"enabled":"disabled"}`)}isEnabled(){return this.isEnabled}calibrate(t){this.calibration={xMin:t.topLeft.x,xMax:t.bottomRight.x,yMin:t.topLeft.y,yMax:t.bottomRight.y},console.log("Touch calibrated:",this.calibration)}getTouchHistory(){return[...this.touchHistory]}clearHistory(){this.touchHistory=[]}}class h{constructor(){this.audioEngine=null,this.deviceSimulator=null,this.uiSimulator=null,this.performanceMonitor=null,this.debugConsole=null,this.touchController=null,this.isInitialized=!1,this.isPlaying=!1,this.currentTrack=null,this.demoMode="realtime",this.autoDemo=!1,this.hardwareSimulation={wifi:!0,battery:100,sdCard:!0},this.init()}async init(){try{console.log("Initializing xtouch Demo..."),this.showLoadingScreen(),await this.initializeModules(),this.setupEventListeners(),await this.startDemoSequence(),this.hideLoadingScreen(),this.isInitialized=!0,console.log("xtouch Demo initialized successfully")}catch(t){console.error("Failed to initialize xtouch Demo:",t),this.showError("Failed to initialize demo. Please refresh and try again.")}}showLoadingScreen(){const t=document.getElementById("loading-screen"),e=document.getElementById("progress-bar");t.classList.remove("hidden");let i=0;const s=setInterval(()=>{i+=Math.random()*20,i>=100&&(i=100,clearInterval(s)),e.style.width=`${i}%`},200)}hideLoadingScreen(){const t=document.getElementById("loading-screen"),e=document.getElementById("main-interface");setTimeout(()=>{t.classList.add("hidden"),e.classList.remove("hidden")},500)}async initializeModules(){this.debugConsole=new x,this.debugConsole.log("Initializing audio engine...","info"),this.audioEngine=new y,await this.audioEngine.init(),this.debugConsole.log("Audio engine initialized","info"),this.debugConsole.log("Initializing device simulator...","info"),this.deviceSimulator=new E,await this.deviceSimulator.init(),this.debugConsole.log("Device simulator initialized","info"),this.debugConsole.log("Initializing UI simulator...","info"),this.uiSimulator=new w,await this.uiSimulator.init(),this.debugConsole.log("UI simulator initialized","info"),this.performanceMonitor=new S,this.performanceMonitor.init(),this.touchController=new k,this.touchController.init(),this.debugConsole.log("All modules initialized","info")}setupEventListeners(){document.getElementById("fullscreen-btn").addEventListener("click",()=>{this.toggleFullscreen()}),document.getElementById("info-btn").addEventListener("click",()=>{this.showInfoModal()}),document.getElementById("modal-close").addEventListener("click",()=>{this.hideInfoModal()}),document.getElementById("audio-file").addEventListener("change",t=>{this.loadAudioFile(t.target.files[0])}),document.getElementById("demo-track-btn").addEventListener("click",()=>{this.loadDemoTrack()}),document.getElementById("master-play").addEventListener("click",()=>{this.togglePlayback()}),document.getElementById("master-pause").addEventListener("click",()=>{this.pausePlayback()}),document.getElementById("master-stop").addEventListener("click",()=>{this.stopPlayback()}),document.getElementById("master-volume").addEventListener("input",t=>{this.setMasterVolume(t.target.value/100)}),document.getElementById("play-btn").addEventListener("click",()=>{this.togglePlayback()}),document.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",e=>{this.navigateToScreen(e.target.dataset.screen)})}),document.querySelectorAll(".back-btn").forEach(t=>{t.addEventListener("click",e=>{this.navigateToScreen(e.target.dataset.target)})}),document.querySelectorAll(".preset-btn").forEach(t=>{t.addEventListener("click",e=>{this.applyEqualizerPreset(e.target.dataset.preset)})}),document.getElementById("simulation-mode").addEventListener("change",t=>{this.setSimulationMode(t.target.value)}),document.getElementById("enable-touch").addEventListener("click",t=>{this.toggleTouchSimulation(t.target)}),document.getElementById("auto-demo").addEventListener("click",()=>{this.toggleAutoDemo()}),document.getElementById("simulate-wifi").addEventListener("click",t=>{this.toggleWiFiSimulation(t.target)}),document.getElementById("simulate-low-battery").addEventListener("click",t=>{this.toggleBatterySimulation(t.target)}),document.getElementById("simulate-sd-error").addEventListener("click",t=>{this.toggleSDCardSimulation(t.target)}),document.getElementById("console-command").addEventListener("keypress",t=>{t.key==="Enter"&&(this.processConsoleCommand(t.target.value),t.target.value="")}),document.getElementById("console-send").addEventListener("click",()=>{const t=document.getElementById("console-command");this.processConsoleCommand(t.value),t.value=""}),document.getElementById("touch-layer").addEventListener("click",t=>{this.handleDeviceTouch(t)}),window.addEventListener("resize",()=>{this.handleResize()}),window.addEventListener("keydown",t=>{this.handleKeyboard(t)})}async startDemoSequence(){this.uiSimulator.showScreen("intro"),await this.sleep(2e3),this.debugConsole.log("Boot sequence complete","info"),this.uiSimulator.showScreen("home"),this.performanceMonitor.start(),await this.loadDemoTrack(),this.autoDemo&&this.startAutoDemo()}async loadDemoTrack(){try{this.debugConsole.log("Loading demo track...","info");const t=this.generateDemoAudio();await this.audioEngine.loadFromBuffer(t,"Demo Track","xtouch Simulator"),this.currentTrack={title:"Demo Track",artist:"xtouch Simulator",duration:225e3},this.updateTrackInfo(),this.debugConsole.log("Demo track loaded","info")}catch(t){console.error("Failed to load demo track:",t),this.debugConsole.log("Failed to load demo track","error")}}async loadAudioFile(t){if(t)try{this.debugConsole.log(`Loading audio file: ${t.name}`,"info");const e=await t.arrayBuffer();await this.audioEngine.loadFromFile(e,t.name),this.currentTrack={title:t.name.replace(/\.[^/.]+$/,""),artist:"User Upload",duration:this.audioEngine.getDuration()},this.updateTrackInfo(),this.debugConsole.log("Audio file loaded successfully","info")}catch(e){console.error("Failed to load audio file:",e),this.debugConsole.log("Failed to load audio file","error")}}generateDemoAudio(){const a=new Float32Array(19845e3);for(let n=0;n<9922500;n++){const o=n/44100,r=440,l=554.37,c=659.25,g=Math.sin(2*Math.PI*r*o)*.3,p=Math.sin(2*Math.PI*l*o)*.2,v=Math.sin(2*Math.PI*c*o)*.1,f=Math.exp(-o*.001)*(1-Math.exp(-o*5)),b=1+.05*Math.sin(2*Math.PI*5*o),u=(g+p+v)*f*b*.5;a[n*2]=u,a[n*2+1]=u}return a}updateTrackInfo(){if(!this.currentTrack)return;document.querySelector(".track-title").textContent=this.currentTrack.title,document.querySelector(".track-artist").textContent=this.currentTrack.artist;const t=this.formatTime(this.currentTrack.duration);document.getElementById("total-time").textContent=t}togglePlayback(){this.isPlaying?this.pausePlayback():this.startPlayback()}startPlayback(){if(!this.audioEngine.isLoaded()){this.debugConsole.log("No audio loaded","warning");return}this.audioEngine.play(),this.isPlaying=!0,document.getElementById("play-btn").textContent="⏸",document.getElementById("master-play").textContent="Pause",this.startPositionUpdates(),this.debugConsole.log("Playback started","info")}pausePlayback(){this.audioEngine.pause(),this.isPlaying=!1,document.getElementById("play-btn").textContent="▶",document.getElementById("master-play").textContent="Play",this.stopPositionUpdates(),this.debugConsole.log("Playback paused","info")}stopPlayback(){this.audioEngine.stop(),this.isPlaying=!1,document.getElementById("play-btn").textContent="▶",document.getElementById("master-play").textContent="Play",document.getElementById("progress-fill").style.width="0%",document.getElementById("current-time").textContent="0:00",this.stopPositionUpdates(),this.debugConsole.log("Playback stopped","info")}setMasterVolume(t){this.audioEngine.setVolume(t),document.getElementById("master-volume-value").textContent=`${Math.round(t*100)}%`,document.getElementById("volume-value").textContent=`${Math.round(t*100)}%`,document.getElementById("volume-slider").value=t*100}startPositionUpdates(){this.positionUpdateInterval=setInterval(()=>{if(this.isPlaying&&this.currentTrack){const t=this.audioEngine.getCurrentTime()*1e3,e=t/this.currentTrack.duration*100;document.getElementById("progress-fill").style.width=`${e}%`,document.getElementById("current-time").textContent=this.formatTime(t),this.audioEngine.updateVisualizer()}},100)}stopPositionUpdates(){this.positionUpdateInterval&&(clearInterval(this.positionUpdateInterval),this.positionUpdateInterval=null)}navigateToScreen(t){this.uiSimulator.showScreen(t),document.querySelectorAll(".tab-btn").forEach(e=>{e.classList.toggle("active",e.dataset.screen===t)}),this.debugConsole.log(`Navigated to ${t} screen`,"debug")}applyEqualizerPreset(t){this.audioEngine.applyEqualizerPreset(t),document.querySelectorAll(".preset-btn").forEach(e=>{e.classList.toggle("active",e.dataset.preset===t)}),this.debugConsole.log(`Applied equalizer preset: ${t}`,"info")}setSimulationMode(t){switch(this.demoMode=t,this.debugConsole.log(`Simulation mode set to: ${t}`,"info"),t){case"fast":this.audioEngine.setPlaybackRate(10);break;case"debug":this.audioEngine.enableDebugMode(!0);break;default:this.audioEngine.setPlaybackRate(1),this.audioEngine.enableDebugMode(!1)}}toggleTouchSimulation(t){const e=t.classList.toggle("active");this.touchController.setEnabled(e),this.debugConsole.log(`Touch simulation ${e?"enabled":"disabled"}`,"info")}toggleAutoDemo(){this.autoDemo=!this.autoDemo,this.autoDemo?this.startAutoDemo():this.stopAutoDemo(),this.debugConsole.log(`Auto demo ${this.autoDemo?"enabled":"disabled"}`,"info")}startAutoDemo(){this.debugConsole.log("Starting auto demo sequence","info"),this.autoDemoInterval=setInterval(()=>{const t=["home","equalizer","settings"],i=(t.indexOf(this.uiSimulator.currentScreen)+1)%t.length;this.navigateToScreen(t[i])},5e3)}stopAutoDemo(){this.autoDemoInterval&&(clearInterval(this.autoDemoInterval),this.autoDemoInterval=null)}toggleWiFiSimulation(t){this.hardwareSimulation.wifi=!t.classList.contains("active"),t.classList.toggle("active");const e=document.querySelector(".wifi-status");e.textContent=this.hardwareSimulation.wifi?"📶":"📵",this.debugConsole.log(`WiFi simulation: ${this.hardwareSimulation.wifi?"connected":"disconnected"}`,"info")}toggleBatterySimulation(t){const e=t.classList.toggle("active");this.hardwareSimulation.battery=e?15:100;const i=document.querySelector(".battery");i.textContent=e?"🪫":"🔋",this.debugConsole.log(`Battery simulation: ${this.hardwareSimulation.battery}%`,"info")}toggleSDCardSimulation(t){this.hardwareSimulation.sdCard=!t.classList.contains("active"),t.classList.toggle("active"),this.hardwareSimulation.sdCard?this.debugConsole.log("SD card restored","info"):this.debugConsole.log("SD card error simulated","error")}handleDeviceTouch(t){if(!this.touchController.isEnabled())return;const e=t.target.getBoundingClientRect(),i=t.clientX-e.left,s=t.clientY-e.top,a=i/e.width*240,n=s/e.height*320;this.touchController.handleTouch(a,n),this.debugConsole.log(`Touch at (${Math.round(a)}, ${Math.round(n)})`,"debug"),this.showTouchFeedback(i,s)}showTouchFeedback(t,e){const i=document.createElement("div");i.style.position="absolute",i.style.left=`${t}px`,i.style.top=`${e}px`,i.style.width="20px",i.style.height="20px",i.style.borderRadius="50%",i.style.background="rgba(255, 255, 255, 0.5)",i.style.pointerEvents="none",i.style.transform="translate(-50%, -50%)",i.style.animation="fadeOut 0.5s ease-out forwards";const s=document.getElementById("touch-layer");s.appendChild(i),setTimeout(()=>{s.removeChild(i)},500)}processConsoleCommand(t){this.debugConsole.log(`> ${t}`,"debug");const e=t.toLowerCase().split(" "),i=e[0];switch(i){case"help":this.debugConsole.log("Available commands: play, pause, stop, volume, eq, status, clear","info");break;case"play":this.startPlayback();break;case"pause":this.pausePlayback();break;case"stop":this.stopPlayback();break;case"volume":e[1]&&this.setMasterVolume(parseFloat(e[1])/100);break;case"eq":e[1]&&this.applyEqualizerPreset(e[1]);break;case"status":this.debugConsole.log(`Playing: ${this.isPlaying}, Mode: ${this.demoMode}`,"info");break;case"clear":this.debugConsole.clear();break;default:this.debugConsole.log(`Unknown command: ${i}`,"error")}}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}showInfoModal(){document.getElementById("info-modal").classList.remove("hidden")}hideInfoModal(){document.getElementById("info-modal").classList.add("hidden")}handleResize(){this.deviceSimulator&&this.deviceSimulator.handleResize(),this.audioEngine&&this.audioEngine.handleResize()}handleKeyboard(t){if(t.ctrlKey||t.metaKey)switch(t.key){case" ":t.preventDefault(),this.togglePlayback();break;case"f":t.preventDefault(),this.toggleFullscreen();break;case"i":t.preventDefault(),this.showInfoModal();break}else switch(t.key){case"Escape":this.hideInfoModal();break}}showError(t){this.debugConsole.log(t,"error"),alert(t)}formatTime(t){const e=Math.floor(t/1e3),i=Math.floor(e/60),s=e%60;return`${i}:${s.toString().padStart(2,"0")}`}sleep(t){return new Promise(e=>setTimeout(e,t))}}const m=document.createElement("style");m.textContent=`
    @keyframes fadeOut {
        0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
    }
`;document.head.appendChild(m);document.addEventListener("DOMContentLoaded",()=>{window.xtouchDemo=new h});window.XTouchDemo=h;
