import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ExternalLink } from 'lucide-react';
import { ListingsTableProps, SortField } from '../../props';

export const ListingsTable: React.FC<ListingsTableProps> = ({
  listings,
  sortOption,
  onSortToggle,
}) => {
  const renderSortIcon = (field: SortField) => {
    if (field === 'price') {
      if (sortOption === 'price_asc') return <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline" />;
      if (sortOption === 'price_desc') return <ArrowDown className="w-3.5 h-3.5 text-amber-400 inline" />;
    } else if (field === 'pm2') {
      if (sortOption === 'pm2_asc') return <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline" />;
      if (sortOption === 'pm2_desc') return <ArrowDown className="w-3.5 h-3.5 text-amber-400 inline" />;
    } else if (field === 'area') {
      if (sortOption === 'area_asc') return <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline" />;
      if (sortOption === 'area_desc') return <ArrowDown className="w-3.5 h-3.5 text-amber-400 inline" />;
    } else if (field === 'views') {
      if (sortOption === 'views_desc') return <ArrowDown className="w-3.5 h-3.5 text-purple-400 inline" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-500 hover:text-slate-300 inline opacity-60" />;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Oglas</th>
              <th className="py-3 px-3">Kategorija</th>
              <th className="py-3 px-3">Kvart / Lokacija</th>
              <th
                onClick={() => onSortToggle('area')}
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                title="Sortiraj po površini"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Površina {renderSortIcon('area')}
                </span>
              </th>
              <th
                onClick={() => onSortToggle('price')}
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                title="Sortiraj po cijeni"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Cijena {renderSortIcon('price')}
                </span>
              </th>
              <th
                onClick={() => onSortToggle('pm2')}
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                title="Sortiraj po €/m²"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  €/m² {renderSortIcon('pm2')}
                </span>
              </th>
              <th
                onClick={() => onSortToggle('views')}
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                title="Sortiraj po broju pregleda"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Pregledi {renderSortIcon('views')}
                </span>
              </th>
              <th className="py-3 px-3">Oglašivač</th>
              <th className="py-3 px-3 text-center">Akcija</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {listings.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="py-2.5 px-3 max-w-[280px]">
                  <div className="font-semibold text-slate-100 truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">#{item.njuskalo_id}</div>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.category_name?.includes('najam') || item.url?.includes('iznajmljivanje')
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {item.category_name?.includes('najam') || item.url?.includes('iznajmljivanje')
                      ? 'Najam'
                      : 'Prodaja'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">
                  {item.neighborhood || item.location_summary || 'Zagreb'}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-200">
                  {item.living_area_m2 ? `${item.living_area_m2} m²` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                  {item.price_eur ? `${item.price_eur.toLocaleString()} €` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-amber-400">
                  {item.price_per_m2_eur ? `${item.price_per_m2_eur.toLocaleString()} €` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-purple-400">
                  {item.views_count ? item.views_count.toLocaleString() : '-'}
                </td>
                <td className="py-2.5 px-3 max-w-[180px]">
                  <div className="truncate text-slate-300">{item.seller_name || '-'}</div>
                  <span className="text-[10px] text-slate-400">{item.seller_type || '-'}</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
                  >
                    Otvori <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
