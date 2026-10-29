import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NeighborhoodChartProps } from '../../props';

export const NeighborhoodsChart: React.FC<NeighborhoodChartProps> = ({ data, category }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-slate-100">
            Prosječne cijene po kvadratu (€/m²) po kvartovima
          </h3>
          <p className="text-xs text-slate-400">
            Usporedba cijena za {category === 'rent' ? 'Najam' : 'Prodaju'} po zagrebačkim kvartovima
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <XAxis
              dataKey="neighborhood"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`${val} €/m²`, 'Prosj. Cijena']}
            />
            <Bar dataKey="avg_pm2" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
