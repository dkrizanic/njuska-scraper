import React from 'react';
import { Sparkles, Building2, BarChart3, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentTab: 'arbitrage' | 'listings' | 'analytics';
  totalListings: number;
  loading: boolean;
  onSelectTab: (tab: 'arbitrage' | 'listings' | 'analytics') => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  totalListings,
  loading,
  onSelectTab,
  onRefresh,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0f1523]/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
          Nj
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
            Njuškalo Real Estate Intelligence
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              PostgreSQL Live
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Croatia Property Scraper, Rent-to-Rent Arbitrage & Marketing Analytics
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
        <button
          onClick={() => onSelectTab('arbitrage')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'arbitrage'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Podnajam / Arbitrage
        </button>
        <button
          onClick={() => onSelectTab('listings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'listings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Svi Oglasi ({totalListings})
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentTab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Tržišna Analitika & Marketing
        </button>
      </div>

      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Osvježi
      </button>
    </header>
  );
};
