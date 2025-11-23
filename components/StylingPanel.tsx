import React, { useState } from 'react';
import { CarDesign } from '../types';
import { Wand2, CheckCircle2, Sliders, Image as ImageIcon, RotateCcw, Save } from 'lucide-react';

interface StylingPanelProps {
  designs: CarDesign[];
  selectedDesignId: string | null;
  onSelectDesign: (id: string) => void;
  isGenerating: boolean;
}

const StylingPanel: React.FC<StylingPanelProps> = ({ designs, selectedDesignId, onSelectDesign, isGenerating }) => {
  const [prompt, setPrompt] = useState('Futuristic estateback, cyberpunk aesthetic, neon lighting, highly detailed, 8k');
  const [negativePrompt, setNegativePrompt] = useState('low quality, blurry, distorted, ugly, bad anatomy');
  const [cfgScale, setCfgScale] = useState(7.5);
  const [steps, setSteps] = useState(50);
  const [seed, setSeed] = useState(-1);

  return (
    <div className="flex h-full bg-slate-950">
      
      {/* Left Control Sidebar */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center text-white font-bold mb-6">
            <Sliders className="w-5 h-5 mr-2 text-brand-accent" />
            <span>生成参数配置</span>
        </div>

        <div className="space-y-6">
            {/* Prompt Input */}
            <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">正向提示词 (POSITIVE PROMPT)</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none resize-none"
                />
            </div>

            {/* Negative Prompt */}
            <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">反向提示词 (NEGATIVE PROMPT)</label>
                <textarea 
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full h-16 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-brand-danger focus:ring-1 focus:ring-brand-danger outline-none resize-none"
                />
            </div>

            {/* Sliders */}
            <div>
                 <div className="flex justify-between mb-1">
                    <label className="text-xs font-mono text-slate-400">提示词相关性 (CFG SCALE)</label>
                    <span className="text-xs font-mono text-brand-blue">{cfgScale}</span>
                 </div>
                 <input 
                    type="range" min="1" max="20" step="0.5" 
                    value={cfgScale} 
                    onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                 />
            </div>

            <div>
                 <div className="flex justify-between mb-1">
                    <label className="text-xs font-mono text-slate-400">采样步数 (STEPS)</label>
                    <span className="text-xs font-mono text-brand-blue">{steps}</span>
                 </div>
                 <input 
                    type="range" min="10" max="150" step="1" 
                    value={steps} 
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                 />
            </div>

             <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">随机种子 (SEED)</label>
                <div className="flex space-x-2">
                    <input 
                        type="number" 
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value))}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200"
                    />
                    <button className="p-1 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="随机">
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            <button className="w-full py-3 bg-brand-blue hover:bg-blue-600 text-white font-medium rounded flex items-center justify-center transition-colors shadow-lg shadow-blue-900/20">
                <Wand2 className="w-4 h-4 mr-2" />
                生成变体
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-bold text-white">造型智能体 (Styling Agent) <span className="text-slate-500 font-normal">/ 方案库</span></h2>
            </div>
            {isGenerating && (
                <div className="flex items-center text-brand-accent text-sm font-mono bg-brand-accent/10 px-3 py-1 rounded border border-brand-accent/20">
                    <span className="animate-spin mr-2">⟳</span> 处理中...
                </div>
            )}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-4">
            {designs.map((design) => (
            <div 
                key={design.id}
                onClick={() => onSelectDesign(design.id)}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedDesignId === design.id 
                    ? 'border-brand-blue ring-1 ring-brand-blue bg-slate-900' 
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                }`}
            >
                <div className="relative aspect-video bg-slate-950">
                    <img 
                        src={design.imageUrl} 
                        alt={design.name} 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                    />
                    
                    {selectedDesignId === design.id && (
                        <div className="absolute top-2 right-2 bg-brand-blue text-white rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                         <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-sm font-bold text-white">{design.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{design.type} • {design.styleParams.vibe}</p>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 text-right">
                                <div>S: {design.styleParams.seed}</div>
                                <div>CFG: {design.styleParams.cfg}</div>
                            </div>
                         </div>
                    </div>
                </div>
                
                {/* Quick Actions Overlay */}
                <div className="absolute top-2 left-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-black/60 backdrop-blur rounded text-white hover:bg-brand-blue"><Save className="w-3 h-3" /></button>
                    <button className="p-1.5 bg-black/60 backdrop-blur rounded text-white hover:bg-brand-blue"><ImageIcon className="w-3 h-3" /></button>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StylingPanel;