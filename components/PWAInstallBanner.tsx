
import React, { useState, useEffect } from 'react';

const PWAInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate detecting if installable or just showing it for UX
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 animate-bounce-in">
      <div className="glass-effect p-5 rounded-2xl shadow-2xl border-amber-500/20 border flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500 flex-shrink-0 flex items-center justify-center text-slate-950">
          <i className="fas fa-download text-xl"></i>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-50 mb-1">Install BananaEdit AI</h3>
          <p className="text-sm text-slate-400 mb-4">Add this app to your home screen for full-screen editing and offline features.</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10"
            >
              Install Now
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-all"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-slate-300">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
