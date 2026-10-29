import React from 'react';
import { Building2, DollarSign, Home, Eye, TrendingUp, Users } from 'lucide-react';
import { KpiCardsProps } from '../../props';

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, arbitrageCount }) => {
  return (
    <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Ukupno Stanova</span>
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-slate-100">
          {stats?.totalListings?.toLocaleString() || '-'}
        </div>
        <div className="text-[11px] text-emerald-400 mt-0.5">
          {stats?.rentalsCount || 0} najam • {stats?.salesCount || 0} prodaja
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Prosj. Cijena Najma</span>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-amber-400">
          {stats?.avgRentPrice ? `${stats.avgRentPrice} €` : '-'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {stats?.avgRentPm2 ? `${stats.avgRentPm2} €/m² prosjek` : '-'}
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Prosj. Prodajna Cijena</span>
          <Home className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-emerald-400">
          {stats?.avgSalePrice ? `${stats.avgSalePrice.toLocaleString()} €` : '-'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {stats?.avgSalePm2 ? `${stats.avgSalePm2} €/m² Zagreb` : '-'}
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pregledi Oglasa</span>
          <Eye className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-purple-400">
          {stats?.totalViews ? stats.totalViews.toLocaleString() : '-'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Prosj. {stats?.avgViews || 0} po stanu
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Prilike za Podnajam</span>
          <TrendingUp className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-yellow-400">{arbitrageCount}</div>
        <div className="text-[11px] text-yellow-500/80 mt-0.5">Ispod prosjeka kvarta</div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Oglašivači / Korisnici</span>
          <Users className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-xl font-bold mt-1 text-sky-400">{stats?.sellersCount || '-'}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Vlasnici & Agencije</div>
      </div>
    </div>
  );
};
