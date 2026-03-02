
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-effect border-r border-slate-800 p-6 z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
            <i className="fas fa-magic text-xl"></i>
          </div>
          <h1 className="text-xl font-bold gradient-text">BananaEdit</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 transition-all">
            <i className="fas fa-wand-sparkles"></i>
            <span className="font-medium">AI Editor</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all">
            <i className="fas fa-history"></i>
            <span className="font-medium">History</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all">
            <i className="fas fa-layer-group"></i>
            <span className="font-medium">Presets</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Pro Plan</p>
            <p className="text-sm font-medium mb-3">Unlimited AI Generations</p>
            <button className="w-full py-2 px-4 rounded-lg bg-slate-800 text-xs font-bold hover:bg-slate-700 transition-all">
              Manage Subscription
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden glass-effect border-b border-slate-800 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900">
            <i className="fas fa-magic text-sm"></i>
          </div>
          <h1 className="text-lg font-bold gradient-text">BananaEdit</h1>
        </div>
        <button className="p-2 text-slate-400">
          <i className="fas fa-bars text-xl"></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto scrollbar-hide">
        {children}
      </main>
    </div>
  );
};

export default Layout;
