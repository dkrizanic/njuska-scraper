import React from 'react';
import { Sparkles } from 'lucide-react';
import { ArbitrageGridProps } from '../../props';
import { ArbitrageCard } from './ArbitrageCard';

export const ArbitrageGrid: React.FC<ArbitrageGridProps> = ({ items, loading }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Detektor prilika za Podnajam (Rent-to-Rent / Sublease)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Ovi stanovi za najam imaju cijenu po kvadratu (€/m²) <strong>značajno nižu od prosjeka svog kvarta</strong>.{' '}
              Posebno su označeni stanovi od privatnih vlasnika (<code className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded">korisnik</code>){' '}
              koji su najotvoreniji za dugoročni dogovor i podnajam turistima ili poslovnim ljudima.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400">Pronađeno prilika:</span>
            <div className="text-2xl font-black text-amber-400">{items.length}</div>
          </div>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Učitavanje prilika za podnajam...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ArbitrageCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
