import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentRole } from '../types';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-80 xl:w-96 shadow-2xl z-10">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="font-semibold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-brand-blue" />
            调度器对话 (Orchestrator)
        </div>
        <div className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-900/50 animate-pulse">
            在线
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === AgentRole.User ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center mb-1">
                {msg.role === AgentRole.User ? (
                    <span className="text-xs text-slate-500 font-mono mr-2">用户</span>
                ) : (
                    <span className="text-xs text-brand-blue font-mono ml-2">AUTO-GEN</span>
                )}
            </div>
            <div 
              className={`max-w-[90%] rounded-2xl p-3 text-sm ${
                msg.role === AgentRole.User 
                  ? 'bg-brand-blue text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex flex-col items-start">
             <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入指令..."
            className="w-full bg-slate-900 border border-slate-700 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors placeholder-slate-600"
            disabled={isThinking}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-brand-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-brand-blue transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;