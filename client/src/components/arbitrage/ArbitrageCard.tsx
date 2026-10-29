import React from 'react';
import { ArrowDownRight, Users, Eye, ExternalLink } from 'lucide-react';
import { ArbitrageCardProps } from '../../props';

export const ArbitrageCard: React.FC<ArbitrageCardProps> = ({ item }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition flex flex-col justify-between group shadow-sm hover:shadow-amber-500/10">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            {item.discount_percentage}% jeftinije od kvarta
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {item.neighborhood || 'Zagreb'}
          </span>
        </div>

        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-300 transition">
          {item.title}
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
          <div>
            <span className="text-slate-400">Mjesečni najam:</span>
            <div className="text-base font-bold text-emerald-400">
              {item.price_eur ? item.price_eur.toLocaleString() : '-'} €
            </div>
          </div>
          <div>
            <span className="text-slate-400">Cijena po m²:</span>
            <div className="font-semibold text-slate-200">
              {item.price_per_m2_eur} €/m²{' '}
              <span className="text-[10px] text-slate-400">(kvart: {item.neighborhood_avg_pm2} €)</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400">Površina & sobe:</span>
            <div className="font-semibold text-slate-200">
              {item.living_area_m2} m² • {item.rooms || '-'}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Est. mjesečni profit:</span>
            <div className="text-sm font-bold text-amber-400">
              +{item.estimated_monthly_profit} €/mj
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{item.seller_name || '-'}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                item.seller_type === 'korisnik'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {item.seller_type === 'korisnik' ? 'Vlasnik' : 'Agencija'}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            {item.views_count ? item.views_count.toLocaleString() : '-'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">ID: #{item.njuskalo_id}</span>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
        >
          Otvori oglas na Njuškalu
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
