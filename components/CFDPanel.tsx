
import React, { useState, useRef, useEffect } from 'react';
import { CarDesign } from '../types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Wind, Activity, Settings, Play, Download, Layers, Eye, RotateCw, Zap, Maximize2, Thermometer, Gauge } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CFDPanelProps {
  design: CarDesign | null;
}

// GLSL: Turbo Colormap (High contrast, perceptually uniform)
const TURBO_COLORMAP_GLSL = `
vec3 turbo(float t) {
  t = clamp(t, 0.0, 1.0);
  const vec4 kRed = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  const vec4 kGreen = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  const vec4 kBlue = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  return vec3(
    dot(kRed, vec4(1.0, t, t * t, t * t * t)),
    dot(kGreen, vec4(1.0, t, t * t, t * t * t)),
    dot(kBlue, vec4(1.0, t, t * t, t * t * t))
  );
}
`;

const CFDPanel: React.FC<CFDPanelProps> = ({ design }) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'monitor' | 'post'>('post');
  const mountRef = useRef<HTMLDivElement>(null);
  const [vizMode, setVizMode] = useState<'pressure' | 'velocity' | 'combined'>('combined');
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [streamlineDensity, setStreamlineDensity] = useState(0.7); // 0 to 1
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const streamlinesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const carMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Particle State
  const PARTICLE_COUNT = 5000;
  const dummy = new THREE.Object3D();
  const particlesRef = useRef<{
    pos: Float32Array;
    vel: Float32Array;
    life: Float32Array;
    speed: Float32Array;
  } | null>(null);

  // --- 3D Scene Setup ---
  useEffect(() => {
    if (activeTab !== 'post' || !mountRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505'); // Deep black studio
    scene.fog = new THREE.Fog('#050505', 10, 50);
    sceneRef.current = scene;

    // 2. Camera
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(-8, 3, 8); // ISO Front-Left view
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
    controls.target.set(0, 0.5, 0);

    // 5. Lighting (Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Key Light (Soft overhead)
    const keyLight = new THREE.RectAreaLight(0xffffff, 2, 10, 10);
    keyLight.position.set(0, 8, 0);
    keyLight.lookAt(0, 0, 0);
    scene.add(keyLight);

    // Rim Light (Cool Blue)
    const rimLight1 = new THREE.SpotLight(0x3b82f6, 20);
    rimLight1.position.set(-10, 2, -5);
    rimLight1.lookAt(0, 0, 0);
    scene.add(rimLight1);

    // Rim Light (Warm Orange)
    const rimLight2 = new THREE.SpotLight(0xf97316, 10);
    rimLight2.position.set(10, 2, 5);
    rimLight2.lookAt(0, 0, 0);
    scene.add(rimLight2);

    // 6. Floor (Reflective)
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x050505, 
        roughness: 0.1, 
        metalness: 0.5,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grid
    const grid = new THREE.GridHelper(50, 50, 0x222222, 0x111111);
    grid.position.y = 0.01;
    scene.add(grid);

    // 7. Car Model with Physics Shader
    const createCar = () => {
        const carGroup = new THREE.Group();

        // -- SHADER DEFINITION --
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform vec3 uWindDir;
            uniform float uVizMode; // 0: Pressure, 1: Velocity (simulated), 2: Metallic
            
            ${TURBO_COLORMAP_GLSL}

            void main() {
                vec3 viewDir = normalize(cameraPosition - vPosition);
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(vec3(5.0, 10.0, 5.0));
                
                // Physics approximations
                float Cp = dot(normal, uWindDir); // Pressure coefficient proxy
                
                // Simulation of velocity on surface (faster on top/sides)
                float velocityFactor = 1.0 - abs(dot(normal, uWindDir));
                velocityFactor = smoothstep(0.0, 1.0, velocityFactor);

                vec3 baseColor = vec3(0.05); // Dark metallic base
                vec3 vizColor = vec3(0.0);

                if (uVizMode < 0.5) {
                    // Pressure Mode: Stagnation (1.0) -> Red, Suction (-1.0) -> Blue
                    float pNorm = smoothstep(-0.5, 1.0, Cp);
                    vizColor = turbo(pNorm);
                } else if (uVizMode < 1.5) {
                    // Velocity Mode: Slow (0.0) -> Blue, Fast (1.0) -> Red
                    // Stagnation points have low velocity
                    vizColor = turbo(velocityFactor);
                } else {
                    // Combined/Metallic Mode
                    // Show subtle pressure map mixed with metallic
                    float pNorm = smoothstep(-0.5, 1.0, Cp);
                    vec3 pressureColor = turbo(pNorm);
                    baseColor = mix(vec3(0.2), pressureColor, 0.4); // 40% blend
                }

                // Standard Lighting (Blinn-Phong approximation)
                float diffuse = max(dot(normal, lightDir), 0.0);
                float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
                
                // Rim lighting for contour definition
                float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
                
                vec3 finalColor;
                if (uVizMode > 1.5) {
                    finalColor = baseColor * (diffuse + 0.2) + vec3(1.0) * specular * 0.5 + vec3(0.2, 0.5, 1.0) * fresnel * 0.5;
                } else {
                    finalColor = vizColor * (diffuse + 0.5) + vec3(1.0) * specular * 0.2;
                }

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const shaderMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uWindDir: { value: new THREE.Vector3(0, 0, 1) }, // Wind from +Z
                uVizMode: { value: 0.0 } // 0: P, 1: V, 2: Mix
            },
            extensions: { derivatives: true }
        });
        carMaterialRef.current = shaderMat;

        // Build Car Geometry (Procedural Sports Car)
        // Main Body
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 4.2, 20, 10, 40);
        const pos = bodyGeo.attributes.position;
        
        // Sculpting loop
        for(let i=0; i<pos.count; i++){
            let x = pos.getX(i);
            let y = pos.getY(i);
            let z = pos.getZ(i);
            
            const zNorm = z / 2.1; // -1 to 1 roughly

            // Taper front (z > 1)
            if (z > 0.5) {
                const f = (z - 0.5) / 1.6;
                y -= f * f * 0.6; // Slope hood down
                x *= (1.0 - f * 0.3); // Narrow nose
            }

            // Taper rear
            if (z < -1.0) {
                y += (z + 1.0) * 0.1; // Slight diffuser rise
            }

            // Wheel arches
            const isWheelArea = (Math.abs(z - 1.2) < 0.5) || (Math.abs(z + 1.2) < 0.5);
            if (isWheelArea && y < 0 && Math.abs(x) > 0.8) {
                y += 0.2; // Lift arches
            }

            // Roof / Cabin curve
            if (y > 0) {
                // Bubble shape
                x *= 0.85; 
            }

            pos.setX(i, x);
            pos.setY(i, y);
            pos.setZ(i, z);
        }
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, shaderMat);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);

        // Cabin
        const cabinGeo = new THREE.SphereGeometry(1, 32, 32);
        cabinGeo.scale(0.7, 0.4, 1.2);
        const cabin = new THREE.Mesh(cabinGeo, shaderMat);
        cabin.position.set(0, 1.1, -0.2);
        carGroup.add(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 });
        const wPos = [
            [0.8, 0.35, 1.2], [-0.8, 0.35, 1.2],
            [0.85, 0.38, -1.2], [-0.85, 0.38, -1.2] // Rear wider
        ];
        wPos.forEach(p => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(p[0], p[1], p[2]);
            w.castShadow = true;
            carGroup.add(w);
        });

        return carGroup;
    };

    const car = createCar();
    scene.add(car);

    // 8. High Fidelity Streamlines (Instanced Mesh)
    // Using thin cylinders (streaks) instead of points for better flow perception
    const initStreamlines = () => {
        const geometry = new THREE.CylinderGeometry(0.005, 0.005, 1.0, 4);
        geometry.rotateX(Math.PI / 2); // Align with Z axis (wind dir)
        
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const mesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(mesh);
        streamlinesMeshRef.current = mesh;

        // Init physics state
        particlesRef.current = {
            pos: new Float32Array(PARTICLE_COUNT * 3),
            vel: new Float32Array(PARTICLE_COUNT * 3),
            life: new Float32Array(PARTICLE_COUNT),
            speed: new Float32Array(PARTICLE_COUNT)
        };

        const { pos, vel, life } = particlesRef.current;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            resetParticle(i, true);
            // Randomize initial z to fill volume
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    };

    const resetParticle = (i: number, initial = false) => {
        if (!particlesRef.current) return;
        const { pos, vel, life } = particlesRef.current;
        
        // Spawn box in front of car (+Z)
        const width = 4;
        const height = 2.5;
        
        pos[i * 3] = (Math.random() - 0.5) * width;     // X
        pos[i * 3 + 1] = Math.random() * height + 0.1;  // Y
        pos[i * 3 + 2] = 8 + Math.random() * 2;         // Z (Start upstream)

        vel[i * 3] = 0;
        vel[i * 3 + 1] = 0;
        vel[i * 3 + 2] = -0.1 - Math.random() * 0.1; // Base wind speed (-Z)

        life[i] = 1.0;
    };

    initStreamlines();

    // --- Animation Loop ---
    const tempColor = new THREE.Color();
    const tempVec = new THREE.Vector3();
    
    const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();

        if (!particlesRef.current || !streamlinesMeshRef.current) return;

        const { pos, vel, life, speed } = particlesRef.current;
        const dt = 0.4; // Time step
        const particleCount = streamlinesMeshRef.current.count;
        
        // Update Uniforms
        if (carMaterialRef.current) {
            const modeVal = vizMode === 'pressure' ? 0.0 : vizMode === 'velocity' ? 1.0 : 2.0;
            carMaterialRef.current.uniforms.uVizMode.value = THREE.MathUtils.lerp(carMaterialRef.current.uniforms.uVizMode.value, modeVal, 0.1);
        }

        // Physics Loop (Potential Flow Approximation)
        // Car is roughly a sphere/ellipsoid at (0, 0.6, 0)
        const obstPos = new THREE.Vector3(0, 0.6, 0.0);
        const obstRadiusSq = 1.5 * 1.5;

        let activeCount = 0;
        const showCount = Math.floor(PARTICLE_COUNT * streamlineDensity);

        for (let i = 0; i < particleCount; i++) {
            if (i > showCount) {
                dummy.position.set(0, -1000, 0); // Hide
                dummy.updateMatrix();
                streamlinesMeshRef.current.setMatrixAt(i, dummy.matrix);
                continue;
            }

            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            // Current Pos
            let px = pos[ix];
            let py = pos[iy];
            let pz = pos[iz];

            // Free stream velocity
            let vx = 0;
            let vy = 0;
            let vz = -0.4; // Main wind speed

            // Obstacle Avoidance (Dipole Term)
            const dx = px - obstPos.x;
            const dy = py - obstPos.y;
            const dz = pz - obstPos.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            
            if (distSq < 20.0) { // Influence range
                const influence = (obstRadiusSq / (distSq * distSq * distSq + 0.1)); 
                // Push away from center
                vx += dx * influence * 2.0;
                vy += dy * influence * 1.5;
                // Slow down in front, speed up on sides (Bernoulli ish)
                // vz is already negative.
            }
            
            // Floor Constraint
            if (py < 0.05) {
                vy += 0.05; 
                py = 0.05;
            }

            // Integrate
            px += vx * dt;
            py += vy * dt;
            pz += vz * dt;

            // Reset if passed bounds
            if (pz < -6) {
                resetParticle(i);
                px = pos[ix];
                py = pos[iy];
                pz = pos[iz];
            }

            pos[ix] = px;
            pos[iy] = py;
            pos[iz] = pz;

            // Calc Speed for Color
            const speedVal = Math.sqrt(vx*vx + vy*vy + vz*vz);
            speed[i] = speedVal;

            // Render Transform
            dummy.position.set(px, py, pz);
            
            // Orient streak along velocity vector
            const targetX = px + vx;
            const targetY = py + vy;
            const targetZ = pz + vz;
            dummy.lookAt(targetX, targetY, targetZ);
            
            // Scale based on speed (Motion blur effect)
            const scaleLen = Math.min(speedVal * 4.0, 3.0); 
            dummy.scale.set(1, 1, scaleLen); 
            
            dummy.updateMatrix();
            streamlinesMeshRef.current.setMatrixAt(i, dummy.matrix);

            // Color based on speed (Blue -> Cyan -> Green -> Red)
            // Normalized speed roughly 0.3 to 0.6
            let t = (speedVal - 0.3) * 3.0; 
            t = Math.max(0, Math.min(1, t));
            
            // Turbo-like gradient manually
            if (t < 0.5) tempColor.setHSL(0.6 - t * 0.4, 1.0, 0.5); // Blue to Green
            else tempColor.setHSL(0.2 - (t-0.5) * 0.2, 1.0, 0.5); // Green to Red

            streamlinesMeshRef.current.setColorAt(i, tempColor);
        }

        if (streamlinesMeshRef.current) {
            streamlinesMeshRef.current.instanceMatrix.needsUpdate = true;
            if (streamlinesMeshRef.current.instanceColor) streamlinesMeshRef.current.instanceColor.needsUpdate = true;
            streamlinesMeshRef.current.visible = showStreamlines;
        }

        renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameRef.current);
        if (mountRef.current && rendererRef.current) {
            mountRef.current.removeChild(rendererRef.current.domElement);
        }
        renderer.dispose();
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (obj.material.dispose) obj.material.dispose();
            }
        });
    };
  }, [activeTab, showStreamlines, vizMode, streamlineDensity]);

  if (!design) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950">
        <Wind className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-mono text-sm">暂无仿真数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4">
              <div className="flex items-center text-white font-bold">
                  <Wind className="w-5 h-5 mr-2 text-brand-cyan" />
                  仿真智能体 (Simulation Agent)
              </div>
              <div className="hidden md:flex bg-slate-950 rounded p-1 border border-slate-800">
                  <button onClick={() => setActiveTab('setup')} className={`px-4 py-1 text-xs font-medium rounded transition-all ${activeTab === 'setup' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}>求解设置</button>
                  <button onClick={() => setActiveTab('monitor')} className={`px-4 py-1 text-xs font-medium rounded transition-all ${activeTab === 'monitor' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}>残差监控</button>
                  <button onClick={() => setActiveTab('post')} className={`px-4 py-1 text-xs font-medium rounded transition-all ${activeTab === 'post' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}>结果可视</button>
              </div>
          </div>
          <div className="flex items-center space-x-6">
              <div className="text-right group cursor-help">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider group-hover:text-brand-cyan transition-colors">Drag Coeff (Cd)</div>
                  <div className="text-xl font-bold text-white font-mono leading-none">{design.cfdData?.dragCoefficient.toFixed(3)}</div>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-right group cursor-help">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider group-hover:text-brand-accent transition-colors">Lift Coeff (Cl)</div>
                  <div className="text-xl font-bold text-white font-mono leading-none">{design.cfdData?.liftCoefficient.toFixed(3)}</div>
              </div>
          </div>
      </div>

      <div className="flex-1 p-0 overflow-hidden relative">
          {/* --- SETUP TAB --- */}
          {activeTab === 'setup' && (
              <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-white font-bold mb-6 flex items-center text-lg"><Settings className="w-5 h-5 mr-2 text-slate-400" /> 物理模型配置</h3>
                      <div className="space-y-5">
                          <div>
                              <label className="text-xs text-slate-400 font-mono block mb-2">TURBULENCE MODEL</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-brand-blue outline-none transition-colors hover:border-slate-600">
                                  <option>k-Omega SST (Menter)</option>
                                  <option>Spalart-Allmaras</option>
                                  <option>Realizable k-Epsilon</option>
                                  <option>Large Eddy Simulation (LES)</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 font-mono block mb-2">TIME DISCRETIZATION</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-brand-blue outline-none transition-colors hover:border-slate-600">
                                  <option>Steady State (simpleFoam)</option>
                                  <option>Transient (pisoFoam)</option>
                              </select>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-white font-bold mb-6 flex items-center text-lg"><Wind className="w-5 h-5 mr-2 text-slate-400" /> 边界条件</h3>
                      <div className="space-y-5">
                          <div>
                              <label className="text-xs text-slate-400 font-mono block mb-2">INLET VELOCITY (m/s)</label>
                              <div className="relative">
                                <input type="number" defaultValue={design.cfdData?.inletVelocity} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono focus:border-brand-blue outline-none" />
                                <div className="absolute right-3 top-3 text-slate-500 text-xs">~ {(design.cfdData!.inletVelocity * 3.6).toFixed(0)} km/h</div>
                              </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                              <span className="text-sm text-slate-300">Moving Ground Plane</span>
                              <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-brand-success">
                                  <span className="absolute left-5 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all"></span>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 mt-4">
                       <button className="w-full py-4 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-900/30 transform hover:scale-[1.01] active:scale-[0.99]">
                            <Play className="w-5 h-5 mr-3 fill-current" />
                            INITIALIZE SOLVER
                       </button>
                  </div>
              </div>
          )}

          {/* --- MONITOR TAB --- */}
          {activeTab === 'monitor' && (
              <div className="p-6 h-full flex flex-col animate-in fade-in">
                <div className="flex-1 bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col relative">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Activity className="w-5 h-5 text-brand-blue mr-3" />
                            <div>
                                <h3 className="text-white font-bold">收敛历史 (Residuals)</h3>
                                <p className="text-xs text-slate-500">Log Scale • 500 Iterations</p>
                            </div>
                        </div>
                        <div className="flex space-x-6 text-xs font-mono">
                             <span className="flex items-center text-slate-300"><div className="w-3 h-1 bg-brand-cyan mr-2"></div> Momentum (Ux, Uy, Uz)</span>
                             <span className="flex items-center text-slate-300"><div className="w-3 h-1 bg-brand-accent mr-2"></div> Pressure (p)</span>
                             <span className="flex items-center text-slate-300"><div className="w-3 h-1 bg-green-500 mr-2"></div> Turbulence (k, omega)</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={design.cfdData?.convergence} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="iteration" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} scale="log" domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ padding: 0 }}
                                />
                                <Line type="monotone" dataKey="residual" stroke="#06b6d4" strokeWidth={2} dot={false} animationDuration={1500} />
                                <Line type="monotone" dataKey="continuity" stroke="#f59e0b" strokeWidth={2} dot={false} animationDuration={1500} />
                                <Line type="monotone" dataKey="continuity" stroke="#22c55e" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              </div>
          )}

          {/* --- POST TAB (3D VIZ) --- */}
          {activeTab === 'post' && (
              <div className="absolute inset-0 flex">
                   {/* Main 3D Viewport */}
                   <div className="flex-1 relative bg-black">
                        {/* Controls Overlay */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3 pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800 text-sm text-white flex items-center shadow-xl">
                                <div className={`w-2 h-2 rounded-full mr-3 ${vizMode === 'pressure' ? 'bg-brand-accent' : 'bg-brand-blue'} animate-pulse`}></div>
                                <span className="font-mono tracking-tight">Real-time CFD Viewer</span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 z-10 flex space-x-2 pointer-events-auto">
                             <button 
                                onClick={() => setShowStreamlines(!showStreamlines)}
                                className={`h-10 w-10 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ${showStreamlines ? 'bg-brand-blue/20 text-brand-blue border-brand-blue' : 'bg-black/50 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                                title="Toggle Streamlines"
                             >
                                 <Wind className="w-5 h-5" />
                             </button>
                             <button className="h-10 w-10 rounded-lg bg-black/50 backdrop-blur-md text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
                                 <Maximize2 className="w-5 h-5" />
                             </button>
                        </div>
                        
                        {/* 3D Container */}
                        <div ref={mountRef} className="w-full h-full cursor-move" />

                        {/* Color Bar Legend */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col items-center pointer-events-none shadow-2xl">
                            <div className="w-64 h-4 rounded-full bg-gradient-to-r from-[rgb(70,130,180)] via-[rgb(50,205,50)] via-[rgb(255,255,0)] to-[rgb(255,69,0)] mb-2 ring-1 ring-white/10"></div>
                            <div className="w-full flex justify-between text-[10px] text-slate-400 font-mono px-1">
                                <span>{vizMode === 'pressure' ? '-2000 Pa (Cp -1.5)' : '0 m/s'}</span>
                                <span className="font-bold text-white">{vizMode === 'pressure' ? 'Surface Pressure' : 'Flow Velocity'}</span>
                                <span>{vizMode === 'pressure' ? '+1500 Pa (Cp 1.0)' : '60 m/s'}</span>
                            </div>
                        </div>
                   </div>

                   {/* Right Controls Sidebar */}
                   <div className="w-72 bg-slate-950/95 backdrop-blur border-l border-slate-800 p-5 flex flex-col z-20 shadow-2xl">
                       <div className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center">
                           <Settings className="w-3 h-3 mr-2" /> 
                           Visualization Control
                       </div>
                       
                       <div className="space-y-8">
                           {/* Viz Mode Selector */}
                           <div>
                               <label className="text-[10px] text-slate-400 mb-3 block font-mono uppercase flex items-center">
                                   <Layers className="w-3 h-3 mr-2" /> Surface Map
                               </label>
                               <div className="grid grid-cols-1 gap-2">
                                   <button 
                                     onClick={() => setVizMode('pressure')}
                                     className={`px-3 py-2.5 rounded-md text-xs font-medium border transition-all text-left flex justify-between group ${vizMode === 'pressure' ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                   >
                                       <span>Pressure Coeff (Cp)</span>
                                       <Thermometer className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                   </button>
                                   <button 
                                     onClick={() => setVizMode('velocity')}
                                     className={`px-3 py-2.5 rounded-md text-xs font-medium border transition-all text-left flex justify-between group ${vizMode === 'velocity' ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                   >
                                       <span>Wall Velocity</span>
                                       <Gauge className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                   </button>
                                   <button 
                                     onClick={() => setVizMode('combined')}
                                     className={`px-3 py-2.5 rounded-md text-xs font-medium border transition-all text-left flex justify-between group ${vizMode === 'combined' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                   >
                                       <span>Metallic + Pressure</span>
                                       <Eye className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                   </button>
                               </div>
                           </div>
                           
                           {/* Streamline Controls */}
                           <div>
                               <div className="flex justify-between items-center mb-3">
                                   <label className="text-[10px] text-slate-400 font-mono uppercase flex items-center">
                                       <Wind className="w-3 h-3 mr-2" /> Streamlines
                                   </label>
                                   <span className="text-[10px] text-brand-blue font-mono">{(streamlineDensity * 100).toFixed(0)}%</span>
                               </div>
                               
                               <input 
                                    type="range" 
                                    min="0" max="1" step="0.05"
                                    value={streamlineDensity}
                                    onChange={(e) => setStreamlineDensity(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue" 
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                                    <span>Sparse</span>
                                    <span>Dense</span>
                                </div>
                           </div>

                           {/* Analysis Stats */}
                           <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                               <div className="flex justify-between text-xs">
                                   <span className="text-slate-500">Avg Velocity</span>
                                   <span className="text-slate-200 font-mono">28.4 m/s</span>
                               </div>
                               <div className="flex justify-between text-xs">
                                   <span className="text-slate-500">Max Pressure</span>
                                   <span className="text-slate-200 font-mono">1420 Pa</span>
                               </div>
                               <div className="flex justify-between text-xs">
                                   <span className="text-slate-500">Wake Length</span>
                                   <span className="text-slate-200 font-mono">1.2 m</span>
                               </div>
                           </div>

                           <div className="mt-auto pt-6">
                               <button className="w-full py-2.5 bg-slate-100 hover:bg-white text-black font-bold text-xs rounded-lg flex items-center justify-center transition-colors shadow-lg">
                                   <Download className="w-3 h-3 mr-2" /> 
                                   Export High-Res Report
                               </button>
                           </div>
                       </div>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default CFDPanel;
