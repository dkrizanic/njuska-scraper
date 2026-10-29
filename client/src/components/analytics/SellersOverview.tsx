import React from 'react';
import { Users, Eye } from 'lucide-react';
import { SellersOverviewProps } from '../../props';

export const SellersOverview: React.FC<SellersOverviewProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          Korisnici & Oglašivači po tipu (Udio prometa)
        </h3>
        <div className="space-y-3">
          {data.sellerTypes.map((st) => (
            <div key={st.seller_type} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="capitalize">
                  {st.seller_type} ({st.unique_accounts} računa)
                </span>
                <span className="text-purple-400">{st.total_views.toLocaleString()} pregleda</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Aktivnih oglasa: {st.active_listings}</span>
                <span>
                  Prosjek: <strong>{st.avg_views} pregleda/stan</strong> • <strong>{st.avg_pm2} €/m²</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          Top Oglašivači po ukupnom broju pregleda
        </h3>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2">Oglašivač</th>
                <th className="py-2">Tip</th>
                <th className="py-2 text-right">Oglasa</th>
                <th className="py-2 text-right">Pregledi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.topSellers.map((s, idx) => (
                <tr key={idx}>
                  <td className="py-2 font-medium text-slate-200 truncate max-w-[160px]">
                    {s.seller_name}
                  </td>
                  <td className="py-2 text-slate-400">{s.seller_type}</td>
                  <td className="py-2 text-right text-slate-300">{s.listings_count}</td>
                  <td className="py-2 text-right font-bold text-purple-400">
                    {s.total_views.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
