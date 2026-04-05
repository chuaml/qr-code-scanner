/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scan, 
  PlusCircle, 
  History as HistoryIcon, 
  ExternalLink, 
  Copy, 
  Trash2,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { Scanner } from './components/Scanner';
import { Generator } from './components/Generator';
import { ConsoleLogger } from './components/ConsoleLogger';
import { cn } from './lib/utils';

interface ScannedItem {
  id: string;
  content: string;
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history'>('scan');
  const [history, setHistory] = useState<ScannedItem[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('scango_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true);
    }
  }, []);

  const saveToHistory = (content: string) => {
    if (content === lastScanned) return; // Prevent duplicates in a row
    
    const newItem: ScannedItem = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      timestamp: Date.now()
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    setLastScanned(content);
    localStorage.setItem('scango_history', JSON.stringify(updatedHistory));
    
    // Switch to history or show a toast? Let's show a temporary overlay
    setTimeout(() => setLastScanned(null), 3000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scango_history');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
            <Scan size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">QR Scanner</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Pro Scanner</p>
          </div>
        </div>
        
        {!isPWA && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                <Smartphone size={12} />
                Install App
            </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <p className="text-zinc-500 text-sm">Point your camera at a QR code to scan instantly.</p>
              </div>
              
              <Scanner onScan={saveToHistory} />

              {lastScanned && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed bottom-24 left-6 right-6 z-50 bg-orange-600 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Scanned Successfully</p>
                    <p className="truncate font-medium">{lastScanned}</p>
                  </div>
                  <button 
                    onClick={() => window.open(lastScanned, '_blank')}
                    className="bg-white text-orange-600 p-2 rounded-xl"
                  >
                    <ExternalLink size={20} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Generator</h2>
                <p className="text-zinc-500 text-sm">Create custom QR codes for URLs, text, or data.</p>
              </div>
              <Generator />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tighter">History</h2>
                  <p className="text-zinc-500 text-sm">Your recent scans are saved locally.</p>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-zinc-500 hover:text-red-400 p-2 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                        <HistoryIcon size={32} />
                    </div>
                    <p className="text-zinc-500">No scan history yet.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3 group hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm font-medium break-all line-clamp-2">{item.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => copyToClipboard(item.content, item.id)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-zinc-400 hover:text-white"
                          >
                            {copiedId === item.id ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                          </button>
                          {item.content.startsWith('http') && (
                            <button 
                              onClick={() => window.open(item.content, '_blank')}
                              className="p-2 bg-orange-600/10 hover:bg-orange-600/20 rounded-xl transition-colors text-orange-500"
                            >
                              <ExternalLink size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-t border-zinc-900 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavButton 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
            icon={<Scan size={24} />} 
            label="Scan" 
          />
          <NavButton 
            active={activeTab === 'generate'} 
            onClick={() => setActiveTab('generate')} 
            icon={<PlusCircle size={24} />} 
            label="Create" 
          />
          <NavButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<HistoryIcon size={24} />} 
            label="History" 
          />
        </div>
      </nav>

      {/* Debug Console */}
      <ConsoleLogger />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-orange-500" : "text-zinc-600 hover:text-zinc-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        active && "bg-orange-500/10"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="w-1 h-1 bg-orange-500 rounded-full mt-1"
        />
      )}
    </button>
  );
}
