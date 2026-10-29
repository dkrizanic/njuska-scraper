import React from 'react';
import { NeighborhoodStat, SellersAnalyticsData } from '../props';
import { NeighborhoodsChart } from '../components/analytics/NeighborhoodsChart';
import { SellersOverview } from '../components/analytics/SellersOverview';

interface AnalyticsPageProps {
  neighborhoods: NeighborhoodStat[];
  sellersData: SellersAnalyticsData;
  categoryFilter: 'all' | 'rent' | 'sale';
  onCategoryChange: (category: 'all' | 'rent' | 'sale') => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  neighborhoods,
  sellersData,
  categoryFilter,
  onCategoryChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
        <span className="text-xs text-slate-300 font-medium">Filtriraj analitiku prema kategoriji:</span>
        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sve
          </button>
          <button
            onClick={() => onCategoryChange('rent')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              categoryFilter === 'rent'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Najam
          </button>
          <button
            onClick={() => onCategoryChange('sale')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              categoryFilter === 'sale' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prodaja
          </button>
        </div>
      </div>

      <NeighborhoodsChart data={neighborhoods} category={categoryFilter} />
      <SellersOverview data={sellersData} />
    </div>
  );
};
