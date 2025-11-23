import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CarDesign } from '../types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { 
  Box, 
  GitBranch, 
  Folder, 
  Eye, 
  Settings, 
  Rotate3d, 
  ZoomIn, 
  ZoomOut, 
  MousePointer2,
  Maximize,
  Download,
  Upload,
  Activity,
  Layers,
  Globe,
  Loader2
} from 'lucide-react';

interface CADPanelProps {
  design: CarDesign | null;
}

const CADPanel: React.FC<CADPanelProps> = ({ design }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Three.js State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const animationFrameRef = useRef<number>(0);

  // UI State
  const [renderMode, setRenderMode] = useState<'wireframe' | 'shaded' | 'analysis'>('shaded');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStats, setModelStats] = useState({ vertices: 0, faces: 0 });
  const [activeTool, setActiveTool] = useState<'rotate' | 'pan'>('rotate');
  const [interpolation, setInterpolation] = useState(0.5);

  // Initialize Three.js
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // slate-900
    scene.fog = new THREE.Fog('#0f172a', 500, 2000);
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.set(400, 300, 400);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(500, 1000, 750);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x3b82f6, 0.5); // Blue rim light
    backLight.position.set(-500, 200, -500);
    scene.add(backLight);

    // 5. Helpers
    const grid = new THREE.GridHelper(2000, 40, 0x1e293b, 0x1e293b);
    scene.add(grid);
    gridRef.current = grid;

    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // 6. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    // Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler
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
    };
  }, []);

  // Construct Procedural Car or Load Design
  useEffect(() => {
    if (!sceneRef.current || !design) return;

    // Cleanup old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Procedural Car Generation (Fallback if no STL)
    const carGroup = new THREE.Group();
    
    // Materials
    const bodyMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x3b82f6, 
      metalness: 0.6, 
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x1e293b, 
      metalness: 0.9, 
      roughness: 0.1, 
      transparent: true, 
      opacity: 0.7 
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    // Dimensions
    const dims = design.cadData?.dimensions || { length: 4500, width: 1800, height: 1400 };
    const L = dims.length / 10; // Scale down for view
    const W = dims.width / 10;
    const H = dims.height / 10;

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(L, H * 0.4, W);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = H * 0.4;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabinL = design.type === 'Sports' ? L * 0.4 : L * 0.6;
    const cabinGeo = new THREE.BoxGeometry(cabinL, H * 0.4, W * 0.85);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.y = H * 0.8;
    cabin.position.x = -L * 0.1;
    carGroup.add(cabin);

    // Wheels
    const wheelR = H * 0.35;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, W * 0.3, 32);
    wheelGeo.rotateX(Math.PI / 2);
    
    const wPositions = [
      { x: L * 0.35, z: W * 0.5 },
      { x: L * 0.35, z: -W * 0.5 },
      { x: -L * 0.35, z: W * 0.5 },
      { x: -L * 0.35, z: -W * 0.5 },
    ];

    wPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos.x, wheelR, pos.z);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    meshRef.current = carGroup;
    sceneRef.current.add(carGroup);

    // Update stats based on procedural gen
    setModelStats({
        vertices: 1200 + Math.floor(Math.random() * 500),
        faces: 800 + Math.floor(Math.random() * 200)
    });

  }, [design]);

  // Handle Render Mode Changes
  useEffect(() => {
    if (!meshRef.current) return;
    
    meshRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (renderMode === 'wireframe') {
          child.material.wireframe = true;
          child.material.color.set(0x06b6d4); // Cyan
        } else if (renderMode === 'shaded') {
            child.material.wireframe = false;
            // Restore colors based on geometry type (simplified)
            if (child.geometry.type === 'CylinderGeometry') child.material.color.set(0x111111);
            else child.material.color.set(0x3b82f6);
        } else if (renderMode === 'analysis') {
            child.material.wireframe = false;
            // Use Normal Material for Analysis look
            child.material = new THREE.MeshNormalMaterial();
        }
        
        // Restore material if switching back from analysis
        if (renderMode !== 'analysis' && child.material.type === 'MeshNormalMaterial') {
             // Re-create simple materials (in real app, store original mats)
             child.material = new THREE.MeshPhysicalMaterial({ color: 0x3b82f6 });
        }
      }
    });
  }, [renderMode]);

  // STL Loading Logic
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sceneRef.current) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as ArrayBuffer;
      const loader = new STLLoader();
      const geometry = loader.parse(contents);
      
      // Center geometry
      geometry.center();
      geometry.computeVertexNormals();

      // Update Mesh
      if (meshRef.current) sceneRef.current?.remove(meshRef.current);

      const material = new THREE.MeshStandardMaterial({ 
        color: 0x60a5fa, 
        metalness: 0.5, 
        roughness: 0.5 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Rotate to standard automotive orientation if needed (Z-up vs Y-up)
      mesh.rotation.x = -Math.PI / 2; 

      const group = new THREE.Group();
      group.add(mesh);
      
      meshRef.current = group;
      sceneRef.current?.add(group);

      // Fit Camera
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      if (cameraRef.current && controlsRef.current) {
         controlsRef.current.reset();
         cameraRef.current.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
         controlsRef.current.update();
      }

      setModelStats({
        vertices: geometry.attributes.position.count,
        faces: geometry.attributes.position.count / 3
      });

      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSimulateGrabCAD = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          // Just trigger a re-render or show a toast in a real app
          alert("已从 GrabCAD 模拟获取模型: 'Generic_Sports_Car_v2.stl'");
      }, 1500);
  };

  const setView = (view: 'iso' | 'top' | 'side' | 'front') => {
    if (!controlsRef.current || !cameraRef.current) return;
    const dist = 600;
    controlsRef.current.reset();
    
    switch(view) {
        case 'iso': cameraRef.current.position.set(400, 300, 400); break;
        case 'top': cameraRef.current.position.set(0, dist, 0); break;
        case 'side': cameraRef.current.position.set(0, 0, dist); break; // Right side
        case 'front': cameraRef.current.position.set(dist, 0, 0); break;
    }
    controlsRef.current.update();
  };

  if (!design) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950">
        <Box className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-mono text-sm">未加载几何模型</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">
        
      {/* Left Sidebar: Feature Tree */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
          <div className="p-3 border-b border-slate-800 font-mono text-xs font-bold text-slate-400 flex justify-between items-center">
              <span>模型树 (MODEL TREE)</span>
              <Settings className="w-3 h-3 cursor-pointer hover:text-white" />
          </div>
          <div className="flex-1 p-2 space-y-1 overflow-y-auto text-sm">
              <div className="flex items-center text-brand-blue font-medium px-2 py-1 bg-slate-800/50 rounded">
                  <Box className="w-3 h-3 mr-2" />
                  <span>{design.id}</span>
              </div>
              <div className="pl-4 space-y-1">
                  {design.cadData?.parts.map((part, idx) => (
                      <div key={idx} className="flex items-center text-slate-300 hover:bg-slate-800 px-2 py-1 rounded cursor-pointer group">
                          <Eye className="w-3 h-3 mr-2 text-slate-500 group-hover:text-white" />
                          <Folder className="w-3 h-3 mr-2 text-brand-accent" />
                          <span>{part}</span>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900">
             <div className="text-xs font-mono font-bold text-slate-400 mb-3 flex items-center">
                 <GitBranch className="w-3 h-3 mr-2" />
                 形态插值 (MORPH)
             </div>
             <div className="space-y-3">
                 <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={interpolation} 
                    onChange={(e) => setInterpolation(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                />
             </div>
          </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
          
          {/* Main Toolbar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl pointer-events-auto space-x-1">
                  <button 
                    onClick={() => setActiveTool('rotate')}
                    className={`p-2 rounded transition-colors ${activeTool === 'rotate' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} 
                    title="Rotate"
                  >
                    <Rotate3d className="w-4 h-4" />
                  </button>
                  <button onClick={() => setView('iso')} className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800" title="ISO View"><Maximize className="w-4 h-4" /></button>
                  <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                  <button onClick={() => setView('top')} className="px-2 py-1 text-xs font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">TOP</button>
                  <button onClick={() => setView('side')} className="px-2 py-1 text-xs font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">SIDE</button>
                  <button onClick={() => setView('front')} className="px-2 py-1 text-xs font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">FRONT</button>
              </div>

              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl pointer-events-auto space-x-1">
                  <button onClick={() => setRenderMode('wireframe')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center ${renderMode === 'wireframe' ? 'bg-slate-800 text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
                      <Box className="w-3 h-3 mr-2" /> 线框
                  </button>
                  <button onClick={() => setRenderMode('shaded')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center ${renderMode === 'shaded' ? 'bg-slate-800 text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
                      <Layers className="w-3 h-3 mr-2" /> 实体
                  </button>
                  <button onClick={() => setRenderMode('analysis')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center ${renderMode === 'analysis' ? 'bg-slate-800 text-brand-accent' : 'text-slate-400 hover:text-white'}`}>
                      <Activity className="w-3 h-3 mr-2" /> 分析
                  </button>
              </div>

              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl pointer-events-auto space-x-1">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".stl"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800" 
                    title="Load STL File"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSimulateGrabCAD}
                    className="p-2 rounded text-slate-400 hover:text-brand-blue hover:bg-slate-800" 
                    title="Download from GrabCAD (Simulated)"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
              </div>
          </div>

          {/* Canvas Container */}
          <div 
            ref={mountRef} 
            className="flex-1 relative cursor-move bg-slate-950"
          >
             {isLoading && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                     <div className="flex flex-col items-center">
                         <Loader2 className="w-10 h-10 text-brand-blue animate-spin mb-4" />
                         <span className="text-white font-mono text-sm">正在处理几何数据...</span>
                     </div>
                 </div>
             )}
             
             {/* Overlay Text */}
             <div className="absolute bottom-4 right-4 text-right pointer-events-none select-none z-10">
                <div className="text-xs font-mono text-slate-500">ENGINE: THREE.JS R161</div>
                <div className="text-xs font-mono text-slate-300">
                    <span className="text-slate-500">VERTS:</span> {modelStats.vertices.toLocaleString()} <br/>
                    <span className="text-slate-500">FACES:</span> {modelStats.faces.toLocaleString()}
                </div>
             </div>
          </div>
      </div>

      {/* Right Sidebar: Properties */}
      <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col z-20">
          <div className="text-xs font-mono font-bold text-slate-400 mb-4 border-b border-slate-800 pb-2">属性面板 (PROPERTIES)</div>
          
          <div className="space-y-4 text-xs">
              <div>
                  <div className="text-slate-500 mb-1">尺寸 (Dimensions mm)</div>
                  <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-red-500 font-bold block">L</span>
                          <span className="text-slate-200">{design.cadData?.dimensions.length}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-green-500 font-bold block">W</span>
                          <span className="text-slate-200">{design.cadData?.dimensions.width}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-blue-500 font-bold block">H</span>
                          <span className="text-slate-200">{design.cadData?.dimensions.height}</span>
                      </div>
                  </div>
              </div>

              <div>
                  <div className="text-slate-500 mb-1">DeepSDF 元数据</div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[10px] break-all text-slate-400">
                      LC: {design.cadData?.latentCode.map(n => n.toFixed(3)).join(', ')}
                  </div>
              </div>
          </div>

          <div className="mt-auto">
             <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded text-xs mb-2 transition-colors flex items-center justify-center">
                 <MousePointer2 className="w-3 h-3 mr-2" /> 检查流形 (Manifold)
             </button>
             <button className="w-full py-2 bg-brand-blue hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-blue-900/20">
                 导出至网格划分 (Export)
             </button>
          </div>
      </div>
    </div>
  );
};

export default CADPanel;