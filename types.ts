export enum AgentRole {
  User = 'User',
  Orchestrator = 'Orchestrator', // AutoGen Manager
  Styling = 'Styling',           // SDXL + ControlNet
  CAD = 'CAD',                   // DeepSDF + Retrieval
  Meshing = 'Meshing',           // OpenFOAM
  Simulation = 'Simulation'      // TripNet + CFD
}

export enum ViewMode {
  Dashboard = 'Dashboard',
  Styling = 'Styling',
  CAD = 'CAD',
  Meshing = 'Meshing',
  Simulation = 'Simulation'
}

export interface Message {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface Project {
  id: string;
  name: string;
  status: 'Active' | 'Queued' | 'Completed' | 'Error';
  lastModified: string;
  owner: string;
  thumbnail?: string;
  progress: number; // 0-100
  stage: 'Concept' | 'Geometry' | 'Meshing' | 'Simulation';
}

export interface CarDesign {
  id: string;
  name: string;
  type: 'Estateback' | 'Sedan' | 'SUV' | 'Sports';
  description: string;
  imageUrl: string;
  styleParams: {
    vibe: string;
    color: string;
    seed: number;
    cfg: number;
    steps: number;
  };
  cadData?: {
    vertices: number;
    faces: number;
    latentCode: number[];
    dimensions: { length: number; width: number; height: number };
    parts: string[];
  };
  meshData?: {
    cells: number;
    quality: 'Pass' | 'Fail';
    nonOrthogonality: number;
    skewness: number;
    aspectRatio: number;
    generatedAt: string;
  };
  cfdData?: {
    dragCoefficient: number;
    liftCoefficient: number;
    pressureMapUrl?: string;
    velocityStreamlinesUrl?: string;
    convergence: { iteration: number; residual: number; continuity: number }[];
    inletVelocity: number;
    frontalArea: number;
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
  source: string;
  code?: number;
}