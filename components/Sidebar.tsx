import React from 'react';
import { ViewMode } from '../types';
import { 
  LayoutDashboard, 
  Palette, 
  Box, 
  Grid3X3, 
  Wind, 
  Terminal,
  Cpu,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  isProcessing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isProcessing }) => {
  
  const navItems = [
    { id: ViewMode.Dashboard, label: '总览仪表盘', icon: LayoutDashboard },
    { id: ViewMode.Styling, label: '造型设计', icon: Palette },
    { id: ViewMode.CAD, label: '几何建模', icon: Box },
    { id: ViewMode.Meshing, label: '网格划分', icon: Grid3X3 },
    { id: ViewMode.Simulation, label: 'CFD 仿真', icon: Wind },
  ];

  return (
    <div className="w-16 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full transition-all duration-300 z-20">
      <div>
        <div className="h-14 flex items-center justify-center lg:justify-start lg:px-5 border-b border-slate-800 bg-slate-950">
          <Cpu className="w-6 h-6 text-brand-blue" />
          <span className="hidden lg:block ml-3 font-mono font-bold text-lg tracking-tighter text-white">
            Aero<span className="text-brand-blue">Gen</span>
            <span className="text-[10px] text-slate-500 ml-1 font-normal">v2.4 CN</span>
          </span>
        </div>

        <div className="py-4 px-2 lg:px-3">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 hidden lg:block px-2">工作区</div>
            <nav className="space-y-1">
            {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 rounded-md transition-all duration-200 group ${
                    isActive 
                        ? 'bg-slate-800 text-white shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-blue' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    <span className="hidden lg:block ml-3 text-sm font-medium">{item.label}</span>
                    {isActive && isProcessing && (
                    <span className="hidden lg:block ml-auto w-1.5 h-1.5 bg-brand-blue rounded-full animate-ping"></span>
                    )}
                </button>
                );
            })}
            </nav>
        </div>
      </div>

      <div>
        <div className="p-4 border-t border-slate-800 space-y-1">
             <button className="w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md">
                 <Settings className="w-4 h-4" />
                 <span className="hidden lg:block ml-3 text-sm">系统设置</span>
             </button>
             <button className="w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md">
                 <HelpCircle className="w-4 h-4" />
                 <span className="hidden lg:block ml-3 text-sm">帮助文档</span>
             </button>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-blue to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    AD
                </div>
                <div className="hidden lg:block ml-3 overflow-hidden">
                    <div className="text-sm font-medium text-white truncate">管理员</div>
                    <div className="text-xs text-slate-500 truncate">工程主管</div>
                </div>
                <button className="hidden lg:block ml-auto text-slate-500 hover:text-white">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;