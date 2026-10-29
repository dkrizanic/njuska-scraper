import React from 'react';
import { Search } from 'lucide-react';
import { ListingFiltersProps } from '../../props';

export const ListingFilters: React.FC<ListingFiltersProps> = ({
  searchQuery,
  categoryFilter,
  sellerTypeFilter,
  sortOption,
  onSearchChange,
  onSearchSubmit,
  onCategoryChange,
  onSellerTypeChange,
  onSortChange,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[280px] relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Pretraži po naslovu, kvartu, vlasniku ili ID-u..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sve
          </button>
          <button
            type="button"
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
            type="button"
            onClick={() => onCategoryChange('sale')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              categoryFilter === 'sale' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prodaja
          </button>
        </div>

        <select
          value={sellerTypeFilter}
          onChange={(e) => onSellerTypeChange(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
        >
          <option value="">Svi Oglašivači</option>
          <option value="korisnik">Samo Privatni Vlasnici (Korisnik)</option>
          <option value="agencija">Agencije (Agencija)</option>
          <option value="investitor">Investitori</option>
        </select>

        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
        >
          <option value="newest">Najnovije spremljeno</option>
          <option value="price_asc">Cijena: Manja prema Većoj</option>
          <option value="price_desc">Cijena: Veća prema Manjoj</option>
          <option value="area_asc">Površina: Manja prema Većoj</option>
          <option value="area_desc">Površina: Veća prema Manjoj</option>
          <option value="pm2_asc">€/m²: Manja prema Većoj</option>
          <option value="pm2_desc">€/m²: Veća prema Manjoj</option>
          <option value="views_desc">Najviše pregleda</option>
        </select>
      </div>
    </div>
  );
};
