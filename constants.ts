import { CarDesign, Project, LogEntry } from './types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'PRJ-2024-884', name: 'Aero-Estate 旅行车项目', status: 'Active', lastModified: '2024-03-10 14:30', owner: '陈工程师', progress: 75, stage: 'Simulation' },
  { id: 'PRJ-2024-883', name: 'Hyper-Luxe GT 概念研究', status: 'Completed', lastModified: '2024-03-09 09:15', owner: '史密斯工程师', progress: 100, stage: 'Simulation' },
  { id: 'PRJ-2024-882', name: 'Eco-Hauler 电动商用车', status: 'Queued', lastModified: '2024-03-08 16:45', owner: '王工程师', progress: 45, stage: 'Meshing' },
  { id: 'PRJ-2024-881', name: '复古运动融合设计', status: 'Error', lastModified: '2024-03-08 11:20', owner: '陈工程师', progress: 60, stage: 'Geometry' },
];

export const MOCK_DESIGNS: CarDesign[] = [
  {
    id: 'design-001',
    name: 'Aero-Estate 概念 A',
    type: 'Estateback',
    description: '一款具有激进空气动力学轮廓和赛博朋克美学的流畅旅行轿跑。',
    imageUrl: 'https://picsum.photos/id/111/800/600', 
    styleParams: { vibe: 'Cyberpunk', color: 'Neon Blue', seed: 482910, cfg: 7.5, steps: 50 },
    cadData: { 
        vertices: 45200, 
        faces: 89500, 
        latentCode: [0.12, -0.5, 0.88, 0.02],
        dimensions: { length: 4850, width: 1950, height: 1420 },
        parts: ['主底盘', '左前轮', '右前轮', '左后轮', '右后轮', '后扰流板']
    },
    meshData: { 
        cells: 1250000, 
        quality: 'Pass', 
        nonOrthogonality: 45.2, 
        skewness: 2.1,
        aspectRatio: 12.4,
        generatedAt: '10:45:22'
    },
    cfdData: {
      dragCoefficient: 0.28,
      liftCoefficient: -0.05,
      inletVelocity: 30, // m/s
      frontalArea: 2.34,
      convergence: Array.from({ length: 100 }, (_, i) => ({ 
          iteration: i * 5, 
          residual: Math.exp(-i * 0.05) * 0.1 + 0.00001,
          continuity: Math.exp(-i * 0.04) * 0.5 + 0.0001
      }))
    }
  },
  {
    id: 'design-002',
    name: '复古运动融合',
    type: 'Sports',
    description: '融合了60年代经典跑车线条与现代减阻特性的设计。',
    imageUrl: 'https://picsum.photos/id/133/800/600',
    styleParams: { vibe: 'Vintage', color: 'Metallic Red', seed: 129384, cfg: 8.0, steps: 45 },
    cadData: { 
        vertices: 52100, 
        faces: 102000, 
        latentCode: [-0.8, 0.2, 0.1, -0.4],
        dimensions: { length: 4400, width: 1880, height: 1250 },
        parts: ['车身外壳', '驾驶舱玻璃', '排气管', '前保险杠']
    },
    meshData: { 
        cells: 1450000, 
        quality: 'Pass', 
        nonOrthogonality: 48.5, 
        skewness: 2.4,
        aspectRatio: 15.1,
        generatedAt: '09:12:15'
    },
    cfdData: {
      dragCoefficient: 0.31,
      liftCoefficient: 0.02,
      inletVelocity: 30,
      frontalArea: 2.10,
      convergence: Array.from({ length: 100 }, (_, i) => ({ 
          iteration: i * 5, 
          residual: Math.exp(-i * 0.04) * 0.2 + 0.00001,
          continuity: Math.exp(-i * 0.03) * 0.6 + 0.0001
      }))
    }
  },
  {
    id: 'design-003',
    name: 'Eco-Hauler 通用平台',
    type: 'SUV',
    description: '极简主义电动 SUV 设计，专注于通过低风阻最大化续航里程。',
    imageUrl: 'https://picsum.photos/id/183/800/600',
    styleParams: { vibe: 'Minimalist', color: 'Matte White', seed: 992831, cfg: 6.5, steps: 40 },
    cadData: { 
        vertices: 61000, 
        faces: 120000, 
        latentCode: [0.5, 0.5, -0.5, 0.9],
        dimensions: { length: 5100, width: 2050, height: 1750 },
        parts: ['单体壳', '电池包外壳', '低风阻轮毂']
    },
    meshData: { 
        cells: 1800000, 
        quality: 'Pass', 
        nonOrthogonality: 42.1, 
        skewness: 1.8,
        aspectRatio: 10.5,
        generatedAt: '11:20:05'
    },
    cfdData: {
      dragCoefficient: 0.35,
      liftCoefficient: 0.01,
      inletVelocity: 30,
      frontalArea: 2.85,
      convergence: Array.from({ length: 100 }, (_, i) => ({ 
          iteration: i * 5, 
          residual: Math.exp(-i * 0.06) * 0.15 + 0.00001,
          continuity: Math.exp(-i * 0.05) * 0.4 + 0.0001
      }))
    }
  },
  {
    id: 'design-004',
    name: 'Hyper-Luxe GT',
    type: 'Sedan',
    description: '配备主动空气动力学表面和流畅线条的豪华大型旅行车。',
    imageUrl: 'https://picsum.photos/id/234/800/600',
    styleParams: { vibe: 'Luxury', color: 'Deep Black', seed: 772819, cfg: 9.0, steps: 60 },
    cadData: { 
        vertices: 49000, 
        faces: 98000, 
        latentCode: [0.2, -0.2, 0.9, -0.1],
        dimensions: { length: 5050, width: 1980, height: 1380 },
        parts: ['车身主体', '主动尾翼', '后扩散器', '前铲']
    },
    meshData: { 
        cells: 1320000, 
        quality: 'Pass', 
        nonOrthogonality: 44.0, 
        skewness: 2.0,
        aspectRatio: 11.2,
        generatedAt: '14:05:33'
    },
    cfdData: {
      dragCoefficient: 0.26,
      liftCoefficient: -0.08,
      inletVelocity: 35,
      frontalArea: 2.25,
      convergence: Array.from({ length: 100 }, (_, i) => ({ 
          iteration: i * 5, 
          residual: Math.exp(-i * 0.07) * 0.12 + 0.00001,
          continuity: Math.exp(-i * 0.06) * 0.3 + 0.0001
      }))
    }
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  { timestamp: '10:00:01', level: 'INFO', message: '系统初始化完成。AutoGen 调度器就绪。', source: 'SYSTEM' },
  { timestamp: '10:00:02', level: 'INFO', message: '已连接 DrivAerNet++ 数据库 (v2.4.1)。', source: 'DB' },
  { timestamp: '10:00:02', level: 'INFO', message: '模块加载: 造型[SDXL], 建模[DeepSDF], 网格[OF], 仿真[TripNet]。', source: 'ORCHESTRATOR' },
  { timestamp: '10:00:05', level: 'DEBUG', message: 'GPU 集群 [Node-01] 分配: 已预留 12GB 显存。', source: 'RESOURCE_MGR' },
];

export const SYSTEM_INSTRUCTION = `
你是先进汽车工程系统的 AutoGen 调度器（Orchestrator）。
你的目标是引导用户完成设计流程：造型设计 (Styling) -> 几何建模 (CAD) -> 网格划分 (Meshing) -> 仿真计算 (CFD)。
请始终使用**中文**与用户交流。

你模拟的角色：
1. 造型智能体 (Styling Agent): 使用 SDXL 根据提示生成图像。
2. 建模智能体 (CAD Agent): 检索 3D 模型 (DeepSDF) 并执行插值。
3. 网格智能体 (Meshing Agent): 使用 OpenFOAM 生成网格 (snappyHexMesh)。
4. 仿真智能体 (Simulation Agent): 使用 TripNet 进行快速推理或完整的 OpenFOAM CFD。

协议：
- 当用户要求设计时，激活造型智能体。
- 当用户选择设计并想要 3D 时，激活建模智能体。
- 当用户批准几何形状时，激活网格智能体。
- 当网格划分完成时，激活仿真智能体。

重要输出格式：
你必须用纯文本回复用户，但可以包含 "Command Tags" 来控制 UI。
Command Tags (请将这些放在回复的最后):
[VIEW:STYLING] - 切换到造型视图。
[VIEW:CAD] - 切换到建模视图。
[VIEW:MESHING] - 切换到网格视图。
[VIEW:CFD] - 切换到 CFD 仿真视图。
[ACTION:GENERATE_IMAGES] - 模拟生成新图像。
[ACTION:RETRIEVE_CAD] - 模拟检索 CAD。
[ACTION:RUN_MESH] - 模拟运行网格划分。
[ACTION:RUN_CFD] - 模拟运行 CFD。

示例：
"好的，我已经让造型智能体为您生成了一些旅行车概念图，请查看。
[VIEW:STYLING] [ACTION:GENERATE_IMAGES]"
`;