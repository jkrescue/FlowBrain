import React, { useEffect, useRef, useState } from 'react';
import { CarDesign, LogEntry } from '../types';
import { Grid3X3, Terminal as TerminalIcon, Check, AlertTriangle, RefreshCw, Settings, Play } from 'lucide-react';

interface MeshingPanelProps {
  design: CarDesign | null;
  logs: LogEntry[];
}

const MeshingPanel: React.FC<MeshingPanelProps> = ({ design, logs }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [baseSize, setBaseSize] = useState(0.5);
  const [surfaceRefinement, setSurfaceRefinement] = useState(3);
  const [layers, setLayers] = useState(5);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!design) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-950">
        <Grid3X3 className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-mono text-sm">未选择几何体</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950">
      {/* Left Config Panel */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col overflow-y-auto">
          <div className="flex items-center text-white font-bold mb-6">
              <Settings className="w-5 h-5 mr-2 text-brand-success" />
              <span>网格配置 (Mesh Config)</span>
          </div>

          <div className="space-y-6">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <h4 className="text-xs font-mono text-brand-blue mb-3 font-bold border-b border-slate-800 pb-1">BLOCKMESH 字典</h4>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">基础单元尺寸 (m)</label>
                          <div className="flex items-center">
                              <input 
                                  type="number" step="0.1" value={baseSize} onChange={e => setBaseSize(parseFloat(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:border-brand-success outline-none" 
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 block mb-1">计算域扩展比例 (%)</label>
                          <input type="range" className="w-full accent-brand-success h-1 bg-slate-800 rounded" />
                      </div>
                  </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <h4 className="text-xs font-mono text-brand-blue mb-3 font-bold border-b border-slate-800 pb-1">SNAPPYHEXMESH 字典</h4>
                  <div className="space-y-3">
                      <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <label>表面细化等级</label>
                              <span className="font-mono text-white">{surfaceRefinement}</span>
                          </div>
                          <input 
                              type="range" min="1" max="5" value={surfaceRefinement} onChange={e => setSurfaceRefinement(parseInt(e.target.value))}
                              className="w-full accent-brand-success h-1 bg-slate-800 rounded" 
                          />
                      </div>
                      <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <label>边界层层数</label>
                              <span className="font-mono text-white">{layers}</span>
                          </div>
                          <input 
                              type="range" min="0" max="10" value={layers} onChange={e => setLayers(parseInt(e.target.value))}
                              className="w-full accent-brand-success h-1 bg-slate-800 rounded" 
                          />
                      </div>
                  </div>
              </div>

              <button className="w-full py-3 bg-brand-success hover:bg-green-600 text-white font-bold rounded flex items-center justify-center transition-colors shadow-lg shadow-green-900/20">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  生成网格
              </button>
          </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800">
               <div className="flex space-x-8">
                   <div className="flex flex-col">
                       <span className="text-[10px] text-slate-500 uppercase tracking-wide">总网格数</span>
                       <span className="text-lg font-mono text-white font-bold">{(design.meshData!.cells / 1000000).toFixed(2)}M</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[10px] text-slate-500 uppercase tracking-wide">最大偏斜度</span>
                       <span className="text-lg font-mono text-brand-success font-bold">{design.meshData?.skewness}</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[10px] text-slate-500 uppercase tracking-wide">质量检查</span>
                       <span className="text-lg font-mono text-brand-success font-bold flex items-center">
                           通过 <Check className="w-4 h-4 ml-1" />
                       </span>
                   </div>
               </div>
               <div>
                   <span className="text-xs text-slate-500">生成时间: {design.meshData?.generatedAt}</span>
               </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
             {/* Log Viewer */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 flex flex-col font-mono text-xs shadow-inner overflow-hidden">
                <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-800">
                    <div className="flex items-center text-slate-400">
                        <TerminalIcon className="w-3 h-3 mr-2" />
                        <span>output.log</span>
                    </div>
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {logs.map((log, index) => (
                        <div key={index} className="flex">
                            <span className="text-slate-600 mr-3 w-16 flex-shrink-0">[{log.timestamp.split(' ')[0]}]</span>
                            <span className={`mr-3 font-bold w-12 flex-shrink-0 ${
                                log.level === 'INFO' ? 'text-blue-400' : 
                                log.level === 'WARN' ? 'text-amber-400' :
                                log.level === 'ERROR' ? 'text-red-400' : 
                                log.level === 'SUCCESS' ? 'text-green-400' : 'text-slate-400'
                            }`}>{log.level}</span>
                            <span className="text-slate-300 break-words">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Quality Histograms (Simulated) */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 flex flex-col">
                 <h4 className="text-xs font-bold text-white mb-4 flex items-center">
                     <RefreshCw className="w-3 h-3 mr-2 text-slate-500" />
                     网格质量指标 (QUALITY METRICS)
                 </h4>
                 
                 <div className="space-y-6 flex-1">
                     <div>
                         <div className="flex justify-between text-xs text-slate-400 mb-1">
                             <span>非正交性分布 (Non-Orthogonality)</span>
                             <span className="text-brand-success">Avg: 12.4</span>
                         </div>
                         <div className="h-24 flex items-end justify-between space-x-1">
                             {[5, 12, 25, 40, 60, 30, 15, 5, 2, 1].map((h, i) => (
                                 <div key={i} className="flex-1 bg-brand-blue/30 hover:bg-brand-blue/60 transition-colors rounded-t" style={{height: `${h}%`}}></div>
                             ))}
                         </div>
                         <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                             <span>0</span>
                             <span>70</span>
                         </div>
                     </div>

                     <div>
                         <div className="flex justify-between text-xs text-slate-400 mb-1">
                             <span>偏斜度分布 (Skewness)</span>
                             <span className="text-brand-success">Max: {design.meshData?.skewness}</span>
                         </div>
                         <div className="h-24 flex items-end justify-between space-x-1">
                             {[50, 80, 40, 20, 10, 5, 2, 1, 0, 0].map((h, i) => (
                                 <div key={i} className="flex-1 bg-brand-cyan/30 hover:bg-brand-cyan/60 transition-colors rounded-t" style={{height: `${h}%`}}></div>
                             ))}
                         </div>
                          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                             <span>0</span>
                             <span>4</span>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default MeshingPanel;