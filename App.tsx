import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import StylingPanel from './components/StylingPanel';
import CADPanel from './components/CADPanel';
import MeshingPanel from './components/MeshingPanel';
import CFDPanel from './components/CFDPanel';
import { Message, AgentRole, ViewMode, LogEntry } from './types';
import { MOCK_DESIGNS, INITIAL_LOGS, MOCK_PROJECTS } from './constants';
import { sendMessageToOrchestrator } from './services/geminiService';

function App() {
  // Application State
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.Dashboard);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: AgentRole.Orchestrator,
      content: "系统在线。运行正常。等待指令。",
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([...INITIAL_LOGS]);
  
  // Derived State
  const selectedDesign = MOCK_DESIGNS.find(d => d.id === selectedDesignId) || null;

  // --- Simulation Helpers ---
  const simulateLogStream = (designName: string) => {
    const newLogs: LogEntry[] = [
      { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: `任务 [MESH-884] 已提交: ${designName}`, source: 'ORCHESTRATOR' },
      { timestamp: new Date().toLocaleTimeString(), level: 'DEBUG', message: `正在分配计算节点 [N1-N4]...`, source: 'SCHEDULER' },
      { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: `读取 STL 几何数据...`, source: 'MESHING' },
    ];
    setLogs(prev => [...prev, ...newLogs]);

    setTimeout(() => {
       setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: `执行 snappyHexMesh (castellatedMesh)...`, source: 'MESHING' }]);
    }, 800);
    
    setTimeout(() => {
       setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), level: 'SUCCESS', message: `网格生成完成。质量检查通过。`, source: 'MESHING' }]);
    }, 2000);
  };

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: AgentRole.User,
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    // 2. Call Gemini Orchestrator
    const response = await sendMessageToOrchestrator(text);

    setIsProcessing(false);

    // 3. Add Orchestrator Message
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: AgentRole.Orchestrator,
      content: response.text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiMsg]);

    // 4. Process Commands/Tools from Orchestrator
    response.commands.forEach(cmd => {
      if (cmd === '[VIEW:STYLING]') setCurrentView(ViewMode.Styling);
      if (cmd === '[VIEW:CAD]') setCurrentView(ViewMode.CAD);
      if (cmd === '[VIEW:MESHING]') setCurrentView(ViewMode.Meshing);
      if (cmd === '[VIEW:CFD]') setCurrentView(ViewMode.Simulation);
      
      if (cmd === '[ACTION:GENERATE_IMAGES]') {
         setCurrentView(ViewMode.Styling);
         // Reset selection to simulate new generation
         setSelectedDesignId(null); 
      }
      
      if (cmd === '[ACTION:RETRIEVE_CAD]') {
         if (selectedDesignId) {
           setCurrentView(ViewMode.CAD);
         } else {
             // Fallback if user asks for CAD without selection, just select the first one
             setSelectedDesignId(MOCK_DESIGNS[0].id);
             setCurrentView(ViewMode.CAD);
         }
      }

      if (cmd === '[ACTION:RUN_MESH]') {
          setCurrentView(ViewMode.Meshing);
          if (selectedDesign) simulateLogStream(selectedDesign.name);
      }

      if (cmd === '[ACTION:RUN_CFD]') {
          setCurrentView(ViewMode.Simulation);
      }
    });
  };

  const handleDesignSelect = (id: string) => {
    setSelectedDesignId(id);
  };

  // --- Rendering ---

  return (
    <div className="flex h-screen bg-black text-slate-200 font-sans overflow-hidden">
      {/* Navigation */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isProcessing={isProcessing}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        
        {/* Header/Breadcrumbs could go here */}
        
        <main className="flex-1 overflow-hidden relative">
          
          {/* Dashboard / Home View */}
          {currentView === ViewMode.Dashboard && (
             <Dashboard projects={MOCK_PROJECTS} onNavigate={setCurrentView} />
          )}

          {/* Agent Views */}
          {currentView === ViewMode.Styling && (
            <StylingPanel 
              designs={MOCK_DESIGNS} 
              selectedDesignId={selectedDesignId} 
              onSelectDesign={handleDesignSelect}
              isGenerating={isProcessing}
            />
          )}

          {currentView === ViewMode.CAD && (
            <CADPanel design={selectedDesign} />
          )}

          {currentView === ViewMode.Meshing && (
            <MeshingPanel design={selectedDesign} logs={logs} />
          )}

          {currentView === ViewMode.Simulation && (
            <CFDPanel design={selectedDesign} />
          )}

        </main>
      </div>

      {/* Chat / Orchestrator Panel */}
      <ChatInterface 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isThinking={isProcessing} 
      />
    </div>
  );
}

export default App;