import React, { useState, useEffect } from 'react';
import { Project, ViewMode } from '../types';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Database, 
  Plus, 
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  User,
  Bot,
  Palette,
  Box,
  Grid3X3,
  Wind,
  Zap,
  Settings,
  X,
  Save,
  RotateCcw,
  ArrowRight,
  Code
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onNavigate: (view: ViewMode) => void;
}

const ResourceCard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-2">
            <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-white font-mono">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
);

// --- Workflow Data Types ---

interface NodeConfig {
    id: string;
    label: string;
    icon: React.ElementType;
    x: number;
    y: number;
    color: string;
    description: string;
    view?: ViewMode;
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    // Data Consistency Props
    inputs: Record<string, any>;
    params: Record<string, any>;
    outputs: Record<string, any>;
}

// --- Initial Workflow State ---

const INITIAL_NODES: NodeConfig[] = [
    { 
        id: 'user', label: '用户输入', icon: User, x: 20, y: 180, color: 'brand-blue', 
        description: '设计需求与参数定义', status: 'COMPLETED',
        inputs: {},
        params: { 'Goal': 'High Speed Aero', 'Budget': 'Unlimited', 'Deadline': '2 Weeks' },
        outputs: { 'req_id': 'REQ-2024-884', 'intent': 'Design Optimization' }
    },
    { 
        id: 'orch', label: 'Orchestrator', icon: Bot, x: 300, y: 180, color: 'purple-500', 
        description: 'AutoGen 任务调度与协调', status: 'RUNNING',
        inputs: { 'req_id': 'REQ-2024-884' },
        params: { 'Strategy': 'Sequential', 'Max Rounds': 10, 'Model': 'GPT-4-Turbo' },
        outputs: { 'plan_id': 'PLAN-A', 'next_agent': 'Styling' }
    },
    { 
        id: 'style', label: '造型智能体', icon: Palette, x: 600, y: 20, color: 'pink-500', view: ViewMode.Styling, 
        description: 'SDXL 图像生成与风格迁移', status: 'IDLE',
        inputs: { 'plan_id': 'PLAN-A', 'style_guide': 'Cyberpunk' },
        params: { 'Batch Size': 4, 'Steps': 50, 'Guidance': 7.5 },
        outputs: { 'image_uris': [] }
    },
    { 
        id: 'cad', label: '建模智能体', icon: Box, x: 600, y: 130, color: 'brand-blue', view: ViewMode.CAD, 
        description: 'DeepSDF 3D 几何重构', status: 'IDLE',
        inputs: { 'image_id': 'IMG-001' },
        params: { 'Resolution': 256, 'Format': 'STL', 'Smoothing': true },
        outputs: { 'geometry_id': '' }
    },
    { 
        id: 'mesh', label: '网格智能体', icon: Grid3X3, x: 600, y: 240, color: 'brand-success', view: ViewMode.Meshing, 
        description: 'OpenFOAM SnappyHexMesh', status: 'IDLE',
        inputs: { 'geometry_id': 'GEO-001' },
        params: { 'Base Size': 0.5, 'Layers': 5, 'Quality': 'High' },
        outputs: { 'mesh_id': '' }
    },
    { 
        id: 'sim', label: '仿真智能体', icon: Wind, x: 600, y: 350, color: 'brand-cyan', view: ViewMode.Simulation, 
        description: 'TripNet 快速流场预测', status: 'IDLE',
        inputs: { 'mesh_id': 'MESH-001' },
        params: { 'Velocity': 30, 'Turbulence': 'k-Omega SST', 'Iterations': 1000 },
        outputs: { 'drag_coeff': 0.0, 'lift_coeff': 0.0 }
    },
];

// --- Components ---

interface NodeProps extends NodeConfig {
    isActive: boolean;
    isSelected: boolean;
    onClick: () => void;
}

const WorkflowNode: React.FC<NodeProps> = ({ label, icon: Icon, x, y, isActive, isSelected, status, onClick, color, description }) => {
    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`absolute w-60 rounded-xl border transition-all duration-300 cursor-pointer group shadow-lg ${
                isSelected
                ? `border-${color} bg-slate-900 shadow-xl shadow-${color}/20 ring-2 ring-${color} z-20`
                : isActive 
                    ? `border-${color} bg-slate-900 shadow-${color}/10 z-10` 
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 z-0'
            }`}
            style={{ 
                left: x, 
                top: y, 
                transform: isSelected ? 'scale(1.05)' : isActive ? 'scale(1.02)' : 'scale(1)' 
            }}
        >
            {/* Header */}
            <div className={`px-4 py-3 border-b border-slate-800/50 flex items-center justify-between rounded-t-xl ${isActive || isSelected ? 'bg-slate-800/50' : ''}`}>
                <div className="flex items-center">
                    <div className={`p-1.5 rounded-lg mr-3 ${isActive || isSelected ? `bg-${color}/20 text-${color}` : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className={`font-semibold text-sm ${isActive || isSelected ? 'text-white' : 'text-slate-300'}`}>{label}</span>
                </div>
                {(isActive || status === 'RUNNING') && (
                    <div className="flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full bg-${color} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 bg-${color}`}></span>
                    </div>
                )}
            </div>
            
            {/* Body */}
            <div className="px-4 py-3">
                <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{description}</p>
                <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        status === 'RUNNING' 
                        ? `bg-${color}/10 border-${color}/20 text-${color}` 
                        : status === 'COMPLETED'
                            ? 'bg-green-900/20 border-green-900/30 text-green-500'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                        {status}
                    </span>
                    <Settings className={`w-3 h-3 ${isSelected ? `text-${color}` : 'text-slate-600'} transition-colors`} />
                </div>
            </div>

            {/* Connecting handles */}
            <div className={`absolute top-1/2 -left-1 w-2 h-2 rounded-full -translate-y-1/2 border border-slate-900 transition-colors ${isSelected ? `bg-${color}` : 'bg-slate-600'}`}></div>
            <div className={`absolute top-1/2 -right-1 w-2 h-2 rounded-full -translate-y-1/2 border border-slate-900 transition-colors ${isSelected ? `bg-${color}` : 'bg-slate-600'}`}></div>
        </div>
    );
};

const WorkflowEdge: React.FC<{ start: {x: number, y: number}, end: {x: number, y: number}, active: boolean, color: string }> = ({ start, end, active, color }) => {
    const cp1 = { x: start.x + (end.x - start.x) / 2, y: start.y };
    const cp2 = { x: start.x + (end.x - start.x) / 2, y: end.y };
    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

    return (
        <g>
            <path d={path} stroke="#1e293b" strokeWidth="2" fill="none" />
            {active && (
                <>
                    <path d={path} stroke={color} strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-pulse-fast opacity-60" />
                    <circle r="3" fill={color}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                    </circle>
                </>
            )}
        </g>
    );
};

const ConfigPanel: React.FC<{ node: NodeConfig, onClose: () => void, onUpdate: (id: string, newParams: any) => void, onNavigate: (v: ViewMode) => void }> = ({ node, onClose, onUpdate, onNavigate }) => {
    const [localParams, setLocalParams] = useState(node.params);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setLocalParams(node.params);
        setIsDirty(false);
    }, [node]);

    const handleParamChange = (key: string, value: any) => {
        setLocalParams(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdate(node.id, localParams);
        setIsDirty(false);
    };

    return (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col animate-slide-in-right backdrop-blur-xl bg-opacity-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center">
                    <node.icon className={`w-4 h-4 mr-2 text-${node.color}`} />
                    <span className="font-bold text-white text-sm">{node.label} 配置</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Inputs Section - Data Consistency Viz */}
                <div>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 flex items-center">
                        <ArrowRight className="w-3 h-3 mr-1" /> 输入数据 (Inputs)
                    </div>
                    <div className="bg-slate-950 rounded border border-slate-800 p-2 space-y-1">
                        {Object.entries(node.inputs).length > 0 ? Object.entries(node.inputs).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                                <span className="text-slate-400 font-mono">{key}:</span>
                                <span className="text-slate-200 truncate ml-2 max-w-[120px]">{String(value)}</span>
                            </div>
                        )) : (
                            <div className="text-xs text-slate-600 italic">无上游输入数据</div>
                        )}
                    </div>
                </div>

                {/* Params Section - Editable */}
                <div>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 flex items-center">
                        <Settings className="w-3 h-3 mr-1" /> 运行参数 (Parameters)
                    </div>
                    <div className="space-y-3">
                        {Object.entries(localParams).map(([key, value]) => (
                            <div key={key}>
                                <label className="text-xs text-slate-300 block mb-1">{key}</label>
                                <input 
                                    type={typeof value === 'number' ? 'number' : 'text'}
                                    value={value as string | number}
                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Outputs Section */}
                <div>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 flex items-center">
                        <Code className="w-3 h-3 mr-1" /> 输出预览 (Outputs)
                    </div>
                    <div className="bg-slate-950 rounded border border-slate-800 p-2 space-y-1 opacity-70">
                        {Object.entries(node.outputs).length > 0 ? Object.entries(node.outputs).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                                <span className="text-slate-400 font-mono">{key}:</span>
                                <span className="text-slate-200 truncate ml-2 max-w-[120px]">{String(value)}</span>
                            </div>
                        )) : (
                            <div className="text-xs text-slate-600 italic">等待执行...</div>
                        )}
                    </div>
                </div>

            </div>

            <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/50">
                 <div className="flex space-x-2">
                     <button 
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center transition-all ${
                            isDirty 
                            ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                     >
                         <Save className="w-3 h-3 mr-2" /> 保存配置
                     </button>
                     <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors" title="重置">
                         <RotateCcw className="w-3 h-3" />
                     </button>
                 </div>
                 {node.view && (
                     <button 
                        onClick={() => onNavigate(node.view!)}
                        className={`w-full py-2 border border-slate-700 hover:border-${node.color} text-slate-300 hover:text-white rounded text-xs flex items-center justify-center transition-colors`}
                     >
                         进入工作台 <ArrowRight className="w-3 h-3 ml-2" />
                     </button>
                 )}
            </div>
        </div>
    );
}

const WorkflowCanvas: React.FC<{ 
    activeStage: string, 
    nodes: NodeConfig[],
    onNodeSelect: (id: string) => void,
    selectedNodeId: string | null
}> = ({ activeStage, nodes, onNodeSelect, selectedNodeId }) => {
    
    // Determine active nodes based on activeStage for visualization
    const isNodeActive = (id: string) => {
        if (id === 'user') return true;
        if (id === 'orch') return true;
        if (activeStage === 'Concept' && id === 'style') return true;
        if (activeStage === 'Geometry' && id === 'cad') return true;
        if (activeStage === 'Meshing' && id === 'mesh') return true;
        if (activeStage === 'Simulation' && id === 'sim') return true;
        return false;
    };

    // Calculate connection points
    const getNodeInputPos = (n: any) => ({ x: n.x, y: n.y + 40 });
    const getNodeOutputPos = (n: any) => ({ x: n.x + 240, y: n.y + 40 });

    const userNode = nodes.find(n => n.id === 'user')!;
    const orchNode = nodes.find(n => n.id === 'orch')!;

    return (
        <div 
            className="relative w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner group"
            onClick={() => onNodeSelect('')} // Deselect on background click
        >
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 pointer-events-none">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                    <Zap className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">工作流编排 (Workflow Orchestration)</h3>
                    <p className="text-xs text-slate-500">Interactive Multi-Agent Pipeline</p>
                </div>
            </div>

            {/* SVG Layer for Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* User -> Orchestrator */}
                <WorkflowEdge 
                    start={getNodeOutputPos(userNode)} 
                    end={getNodeInputPos(orchNode)} 
                    active={true}
                    color="#a855f7" // purple
                />
                
                {/* Orchestrator -> Agents */}
                {nodes.slice(2).map(agent => (
                    <WorkflowEdge 
                        key={agent.id}
                        start={getNodeOutputPos(orchNode)}
                        end={getNodeInputPos(agent)}
                        active={isNodeActive(agent.id)}
                        color={isNodeActive(agent.id) ? agent.color.replace('text-', '#').replace('brand-blue', '#3b82f6').replace('brand-success', '#10b981').replace('brand-cyan', '#06b6d4').replace('purple-500', '#a855f7').replace('pink-500', '#ec4899') : '#334155'}
                    />
                ))}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 z-10">
                {nodes.map(node => (
                    <WorkflowNode 
                        key={node.id}
                        {...node}
                        isActive={isNodeActive(node.id)}
                        isSelected={selectedNodeId === node.id}
                        onClick={() => onNodeSelect(node.id)}
                    />
                ))}
            </div>
            
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                style={{ 
                    backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}
            ></div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ projects, onNavigate }) => {
  // Use the first active project to drive the visualization
  const activeProject = projects.find(p => p.status === 'Active') || projects[0];
  const activeStage = activeProject?.stage || 'Concept';

  // Local state for the editable workflow
  const [nodes, setNodes] = useState<NodeConfig[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleNodeUpdate = (id: string, newParams: any) => {
      setNodes(prev => prev.map(node => 
          node.id === id ? { ...node, params: newParams } : node
      ));
      // In a real app, this would trigger backend sync
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
        case 'Active': return '进行中';
        case 'Completed': return '已完成';
        case 'Queued': return '排队中';
        case 'Error': return '错误';
        default: return status;
    }
  };

  const getStageLabel = (stage: string) => {
      switch(stage) {
          case 'Concept': return '概念设计';
          case 'Geometry': return '几何建模';
          case 'Meshing': return '网格划分';
          case 'Simulation': return '仿真计算';
          default: return stage;
      }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white">运维仪表盘</h1>
                <p className="text-slate-400 text-sm">系统状态: <span className="text-brand-success font-mono">在线</span> • 集群节点: <span className="text-brand-blue font-mono">NODE-01</span></p>
            </div>
            <div className="flex space-x-3">
                <button 
                  onClick={() => onNavigate(ViewMode.Styling)}
                  className="flex items-center px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    新建项目
                </button>
            </div>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResourceCard label="GPU 负载" value="78%" sub="24GB / 32GB 显存" icon={Cpu} color="text-brand-accent" />
            <ResourceCard label="活跃任务" value="3" sub="2 个排队中" icon={Activity} color="text-brand-blue" />
            <ResourceCard label="存储空间" value="4.2 TB" sub="总量 12 TB (RAID 5)" icon={HardDrive} color="text-brand-cyan" />
            <ResourceCard label="运行时间" value="14天 2小时" sub="上次更新: 2周前" icon={Clock} color="text-brand-success" />
        </div>
        
        {/* Workflow Canvas Section */}
        <div className="w-full relative">
            <WorkflowCanvas 
                activeStage={activeStage} 
                nodes={nodes}
                onNodeSelect={(id) => setSelectedNodeId(id || null)}
                selectedNodeId={selectedNodeId}
            />
            
            {/* Config Overlay Panel */}
            {selectedNodeId && selectedNode && (
                <ConfigPanel 
                    node={selectedNode} 
                    onClose={() => setSelectedNodeId(null)}
                    onUpdate={handleNodeUpdate}
                    onNavigate={onNavigate}
                />
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            
            {/* System Health / Queue */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col">
                 <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-slate-500" />
                    任务队列
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px]">
                    {[
                        { id: 'JOB-992', task: 'RANS 湍流仿真', user: '管理员', status: 'Running', progress: 78, color: 'text-brand-blue' },
                        { id: 'JOB-993', task: 'DeepSDF 推理', user: '李工', status: 'Running', progress: 45, color: 'text-brand-blue' },
                        { id: 'JOB-994', task: '网格生成', user: '陈工', status: 'Queued', progress: 0, color: 'text-slate-500' },
                        { id: 'JOB-995', task: '风格迁移', user: '设计师 A', status: 'Queued', progress: 0, color: 'text-slate-500' },
                    ].map((job) => (
                        <div key={job.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-slate-400">{job.id}</span>
                                <span className={`text-[10px] uppercase font-bold ${job.color}`}>
                                    {job.status === 'Running' ? '运行中' : '排队中'}
                                </span>
                            </div>
                            <div className="text-sm font-medium text-white mb-1">{job.task}</div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-500">{job.user}</span>
                                <span className="text-xs font-mono text-slate-300">{job.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                                <div className={`h-full ${job.status === 'Running' ? 'bg-brand-blue' : 'bg-slate-700'}`} style={{ width: `${job.progress}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Projects Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200">最近项目</h3>
                    <button className="text-xs text-brand-blue hover:text-white">查看全部</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 border-b border-slate-800 font-mono text-xs uppercase">
                                <th className="px-6 py-3 font-medium">项目 ID</th>
                                <th className="px-6 py-3 font-medium">项目名称</th>
                                <th className="px-6 py-3 font-medium">阶段</th>
                                <th className="px-6 py-3 font-medium">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-400">{project.id}</td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-slate-600" />
                                            {project.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                            project.stage === 'Simulation' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20' :
                                            project.stage === 'Meshing' ? 'bg-brand-success/10 text-brand-success border-brand-success/20' :
                                            project.stage === 'Geometry' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                                            'bg-slate-700/50 text-slate-400 border-slate-600'
                                        }`}>
                                            {getStageLabel(project.stage)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.status === 'Active' && <span className="flex items-center text-xs text-brand-blue"><PlayCircle className="w-3 h-3 mr-1"/> {getStatusLabel(project.status)}</span>}
                                        {project.status === 'Completed' && <span className="flex items-center text-xs text-brand-success"><CheckCircle className="w-3 h-3 mr-1"/> {getStatusLabel(project.status)}</span>}
                                        {project.status === 'Queued' && <span className="flex items-center text-xs text-slate-500"><Clock className="w-3 h-3 mr-1"/> {getStatusLabel(project.status)}</span>}
                                        {project.status === 'Error' && <span className="flex items-center text-xs text-brand-danger"><AlertCircle className="w-3 h-3 mr-1"/> {getStatusLabel(project.status)}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;