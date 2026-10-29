import React, { useEffect, useState } from 'react';
import { 
  Building2, Home, TrendingUp, Users, Eye, Search, Filter, 
  ExternalLink, ArrowUpRight, ArrowDownRight, Sparkles, DollarSign, BarChart3, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie
} from 'recharts';

interface Stats {
  totalListings: number;
  withPrice: number;
  rentalsCount: number;
  salesCount: number;
  detailedCount: number;
  sellersCount: number;
  totalViews: number;
  avgViews: number;
  avgSalePrice: number;
  avgSalePm2: number;
  avgRentPrice: number;
  avgRentPm2: number;
}

interface Listing {
  id: number;
  njuskalo_id: string;
  url: string;
  title: string;
  category_name: string;
  ad_tier: string;
  price_eur: number;
  price_per_m2_eur: number;
  living_area_m2: number;
  location_summary?: string;
  neighborhood: string;
  rooms: string;
  floor: string;
  views_count: number;
  seller_name: string;
  seller_type: string;
  image_urls: string[];
}

interface ArbitrageOpportunity {
  id: number;
  njuskalo_id: string;
  title: string;
  url: string;
  neighborhood: string;
  living_area_m2: number;
  price_eur: number;
  price_per_m2_eur: number;
  rooms: string;
  floor: string;
  seller_name: string;
  seller_type: string;
  views_count: number;
  neighborhood_avg_pm2: number;
  discount_percentage: number;
  estimated_monthly_profit: number;
  image_urls: string[];
}

export function App() {
  const [tab, setTab] = useState<'listings' | 'arbitrage' | 'analytics'>('arbitrage');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'rent' | 'sale'>('rent');
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [arbitrage, setArbitrage] = useState<ArbitrageOpportunity[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [sellersData, setSellersData] = useState<{ sellerTypes: any[]; topSellers: any[] }>({ sellerTypes: [], topSellers: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const pageSize = 50;

  const API_BASE = 'http://localhost:4000/api';

  const fetchData = async (page = currentPage) => {
    try {
      setLoading(true);
      const [statsRes, arbRes, nbRes, sellersRes] = await Promise.all([
        fetch(`${API_BASE}/stats`).then(r => r.json()),
        fetch(`${API_BASE}/rental-arbitrage`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/neighborhoods?category=${categoryFilter}`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/sellers`).then(r => r.json())
      ]);
      setStats(statsRes);
      setArbitrage(arbRes);
      setNeighborhoods(nbRes);
      setSellersData(sellersRes);

      // Fetch listings with pagination
      const offset = (page - 1) * pageSize;
      const listRes = await fetch(
        `${API_BASE}/listings?category=${categoryFilter === 'all' ? '' : categoryFilter}&query=${encodeURIComponent(searchQuery)}&sellerType=${sellerTypeFilter}&sort=${sortOption}&limit=${pageSize}&offset=${offset}`
      ).then(r => r.json());
      setListings(listRes.items || []);
      setTotalListingsCount(listRes.total || 0);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [categoryFilter, sortOption, sellerTypeFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchData(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleSortToggle = (field: 'price' | 'pm2' | 'area' | 'views') => {
    let nextSort = 'newest';
    if (field === 'price') {
      nextSort = sortOption === 'price_asc' ? 'price_desc' : 'price_asc';
    } else if (field === 'pm2') {
      nextSort = sortOption === 'pm2_asc' ? 'pm2_desc' : 'pm2_asc';
    } else if (field === 'area') {
      nextSort = sortOption === 'area_asc' ? 'area_desc' : 'area_asc';
    } else if (field === 'views') {
      nextSort = sortOption === 'views_desc' ? 'newest' : 'views_desc';
    }
    setSortOption(nextSort);
  };

  const renderSortIcon = (field: 'price' | 'pm2' | 'area' | 'views') => {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData(1);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0f1523]/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
            Nj
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Njuškalo Real Estate Intelligence
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">PostgreSQL Live</span>
            </h1>
            <p className="text-xs text-slate-400">Croatia Property Scraper, Rent-to-Rent Arbitrage & Marketing Analytics</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('arbitrage')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'arbitrage' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Podnajam / Arbitrage
          </button>
          <button
            onClick={() => setTab('listings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'listings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Svi Oglasi ({stats?.totalListings || 0})
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Tržišna Analitika & Marketing
          </button>
        </div>

        <button 
          onClick={() => fetchData()} 
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Osvježi
        </button>
      </header>

      {/* KPI Cards Strip */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ukupno Stanova</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-slate-100">{stats?.totalListings?.toLocaleString() || '-'}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">{stats?.rentalsCount} najam • {stats?.salesCount} prodaja</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prosj. Cijena Najma</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-amber-400">{stats?.avgRentPrice ? `${stats.avgRentPrice} €` : '-'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats?.avgRentPm2} €/m² prosjek</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prosj. Prodajna Cijena</span>
            <Home className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-400">{stats?.avgSalePrice ? `${stats.avgSalePrice.toLocaleString()} €` : '-'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats?.avgSalePm2} €/m² Zagreb</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pregledi Oglasa</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-purple-400">{stats?.totalViews ? stats.totalViews.toLocaleString() : '-'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Prosj. {stats?.avgViews} po stanu</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prilike za Podnajam</span>
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold mt-1 text-yellow-400">{arbitrage.length}</div>
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

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-8">
        {/* TAB 1: RENTAL ARBITRAGE / PODNAJAM */}
        {tab === 'arbitrage' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Detektor prilika za Podnajam (Rent-to-Rent / Sublease)
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Ovi stanovi za najam imaju cijenu po kvadratu (€/m²) <strong>značajno nižu od prosjeka svog kvarta</strong>. 
                    Posebno su označeni stanovi od privatnih vlasnika (<code className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded">korisnik</code>) koji su najotvoreniji za dugoročni dogovor i podnajam turistima ili poslovnim ljudima.
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-400">Pronađeno prilika:</span>
                  <div className="text-2xl font-black text-amber-400">{arbitrage.length}</div>
                </div>
              </div>
            </div>

            {/* Arbitrage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arbitrage.map((item) => (
                <div key={item.id} className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition flex flex-col justify-between group shadow-sm hover:shadow-amber-500/10">
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
                        <div className="text-base font-bold text-emerald-400">{item.price_eur.toLocaleString()} €</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Cijena po m²:</span>
                        <div className="font-semibold text-slate-200">{item.price_per_m2_eur} €/m² <span className="text-[10px] text-slate-400">(kvart: {item.neighborhood_avg_pm2} €)</span></div>
                      </div>
                      <div>
                        <span className="text-slate-400">Površina & sobe:</span>
                        <div className="font-semibold text-slate-200">{item.living_area_m2} m² • {item.rooms || '-'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Est. mjesečni profit:</span>
                        <div className="text-sm font-bold text-amber-400">+{item.estimated_monthly_profit} €/mj</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.seller_name} 
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          item.seller_type === 'korisnik' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'
                        }`}>
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EXPLORER / SVI OGLASI */}
        {tab === 'listings' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pretraži po naslovu, kvartu, vlasniku ili ID-u..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Category switch */}
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
                  <button 
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1 rounded-md font-medium ${categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    Sve
                  </button>
                  <button 
                    onClick={() => setCategoryFilter('rent')}
                    className={`px-3 py-1 rounded-md font-medium ${categoryFilter === 'rent' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    Najam
                  </button>
                  <button 
                    onClick={() => setCategoryFilter('sale')}
                    className={`px-3 py-1 rounded-md font-medium ${categoryFilter === 'sale' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    Prodaja
                  </button>
                </div>

                {/* Seller Type Filter */}
                <select 
                  value={sellerTypeFilter}
                  onChange={(e) => setSellerTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
                >
                  <option value="">Svi Oglašivači</option>
                  <option value="korisnik">Samo Privatni Vlasnici (Korisnik)</option>
                  <option value="agencija">Agencije (Agencija)</option>
                  <option value="investitor">Investitori</option>
                </select>

                {/* Sort */}
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
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

            {/* Listings Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Oglas</th>
                      <th className="py-3 px-3">Kategorija</th>
                      <th className="py-3 px-3">Kvart / Lokacija</th>
                      <th 
                        onClick={() => handleSortToggle('area')} 
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                        title="Klikni za sortiranje po površini"
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
                          Površina {renderSortIcon('area')}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSortToggle('price')} 
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                        title="Klikni za sortiranje po cijeni"
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
                          Cijena {renderSortIcon('price')}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSortToggle('pm2')} 
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                        title="Klikni za sortiranje po €/m²"
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
                          €/m² {renderSortIcon('pm2')}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSortToggle('views')} 
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-slate-100 transition group"
                        title="Klikni za sortiranje po broju pregleda"
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
                          <div className="font-semibold text-slate-100 truncate" title={item.title}>{item.title}</div>
                          <div className="text-[11px] font-mono text-slate-400">#{item.njuskalo_id}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.category_name?.includes('najam') || item.url?.includes('iznajmljivanje') 
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.category_name?.includes('najam') || item.url?.includes('iznajmljivanje') ? 'Najam' : 'Prodaja'}
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

              {/* Pagination Controls */}
              {totalListingsCount > pageSize && (
                <div className="bg-slate-950/90 border-t border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    Prikazano <span className="font-semibold text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, totalListingsCount)}</span> - <span className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, totalListingsCount)}</span> od ukupno <span className="font-semibold text-blue-400">{totalListingsCount.toLocaleString()}</span> stanova
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || loading}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-300"
                      title="Prva stranica"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-300"
                      title="Prethodna stranica"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-2">
                      <span className="text-slate-400">Stranica</span>
                      <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{currentPage}</span>
                      <span className="text-slate-400">od {Math.ceil(totalListingsCount / pageSize)}</span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalListingsCount / pageSize) || loading}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-300"
                      title="Sljedeća stranica"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.ceil(totalListingsCount / pageSize))}
                      disabled={currentPage >= Math.ceil(totalListingsCount / pageSize) || loading}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-300"
                      title="Zadnja stranica"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRŽIŠNA ANALITIKA & MARKETING */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* Chart 1: Neighborhood Prices */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100">Prosječne cijene po kvadratu (€/m²) po kvartovima</h3>
                  <p className="text-xs text-slate-400">Usporedba cijena za {categoryFilter === 'rent' ? 'Najam' : 'Prodaju'} po zagrebačkim kvartovima</p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={neighborhoods.slice(0, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <XAxis dataKey="neighborhood" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} €/m²`, 'Prosj. Cijena']}
                    />
                    <Bar dataKey="avg_pm2" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row with 2 Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seller Types Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Korisnici & Oglašivači po tipu (Udio prometa)
                </h3>
                <div className="space-y-3">
                  {sellersData.sellerTypes.map((st) => (
                    <div key={st.seller_type} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize">{st.seller_type} ({st.unique_accounts} računa)</span>
                        <span className="text-purple-400">{parseInt(st.total_views).toLocaleString()} pregleda</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>Aktivnih oglasa: {st.active_listings}</span>
                        <span>Prosjek: <strong>{st.avg_views} pregleda/stan</strong> • <strong>{st.avg_pm2} €/m²</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 10 Sellers by Views */}
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
                      {sellersData.topSellers.map((s, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium text-slate-200 truncate max-w-[160px]">{s.seller_name}</td>
                          <td className="py-2 text-slate-400">{s.seller_type}</td>
                          <td className="py-2 text-right text-slate-300">{s.listings_count}</td>
                          <td className="py-2 text-right font-bold text-purple-400">{parseInt(s.total_views).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
