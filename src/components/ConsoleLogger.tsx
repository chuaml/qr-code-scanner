import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Trash2, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  type: 'error' | 'warn' | 'log' | 'info';
  message: string;
  timestamp: number;
}

export const ConsoleLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;

    const addLog = (type: LogEntry['type'], ...args: any[]) => {
      const message = args
        .map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 11),
        type,
        message,
        timestamp: Date.now(),
      };

      setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
    };

    console.error = (...args) => {
      addLog('error', ...args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warn', ...args);
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      addLog('log', ...args);
      originalLog.apply(console, args);
    };

    console.info = (...args) => {
      addLog('info', ...args);
      originalInfo.apply(console, args);
    };

    // Global error listener
    const handleError = (event: ErrorEvent) => {
      addLog('error', event.message, `at ${event.filename}:${event.lineno}:${event.colno}`);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog('error', 'Unhandled Rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      console.info = originalInfo;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  if (logs.length === 0 && !isOpen) return null;

  const errorCount = logs.filter(l => l.type === 'error').length;

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "w-[90vw] max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto",
              isMinimized ? "h-12" : "h-[40vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Debug Console</span>
                {errorCount > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {errorCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                >
                  {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button 
                  onClick={() => setLogs([])}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Logs List */}
            {!isMinimized && (
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 selection:bg-orange-500/30"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    No logs yet...
                  </div>
                ) : (
                  logs.map(log => (
                    <div 
                      key={log.id} 
                      className={cn(
                        "p-2 rounded border flex gap-2",
                        log.type === 'error' ? "bg-red-500/5 border-red-500/10 text-red-400" :
                        log.type === 'warn' ? "bg-orange-500/5 border-orange-500/10 text-orange-400" :
                        log.type === 'info' ? "bg-blue-500/5 border-blue-500/10 text-blue-400" :
                        "bg-zinc-900/50 border-zinc-800 text-zinc-400"
                      )}
                    >
                      <div className="shrink-0 opacity-50">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="whitespace-pre-wrap break-all">
                        {log.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          "p-3 rounded-2xl shadow-xl border transition-all pointer-events-auto flex items-center gap-2",
          isOpen ? "opacity-0 scale-90" : "opacity-100 scale-100",
          errorCount > 0 
            ? "bg-red-600 border-red-500 text-white animate-pulse" 
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
        )}
      >
        <Terminal size={20} />
        {errorCount > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {errorCount} Error{errorCount > 1 ? 's' : ''}
          </span>
        )}
      </button>
    </div>
  );
};
