import React, { useEffect, useState, useCallback } from 'react';
import {
  Stats,
  Listing,
  ArbitrageOpportunity,
  NeighborhoodStat,
  SellersAnalyticsData,
  SortField,
} from './props';
import {
  fetchStats,
  fetchArbitrage,
  fetchNeighborhoods,
  fetchSellers,
  fetchListings,
} from './services/api';
import { Navbar } from './components/layout/Navbar';
import { KpiCards } from './components/layout/KpiCards';
import { ArbitragePage } from './pages/ArbitragePage';
import { ListingsPage } from './pages/ListingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export function App() {
  const [tab, setTab] = useState<'arbitrage' | 'listings' | 'analytics'>('arbitrage');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'rent' | 'sale'>('rent');
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [arbitrage, setArbitrage] = useState<ArbitrageOpportunity[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodStat[]>([]);
  const [sellersData, setSellersData] = useState<SellersAnalyticsData>({
    sellerTypes: [],
    topSellers: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const pageSize = 50;

  const loadAggregates = useCallback(async () => {
    try {
      const [statsRes, arbRes, nbRes, sellersRes] = await Promise.all([
        fetchStats(),
        fetchArbitrage(),
        fetchNeighborhoods(categoryFilter),
        fetchSellers(),
      ]);
      setStats(statsRes);
      setArbitrage(arbRes);
      setNeighborhoods(nbRes);
      setSellersData(sellersRes);
    } catch (err) {
      console.error('Error fetching platform aggregates:', err);
    }
  }, [categoryFilter]);

  const loadListings = useCallback(
    async (page: number = currentPage) => {
      try {
        setLoading(true);
        const offset = (page - 1) * pageSize;
        const res = await fetchListings({
          category: categoryFilter,
          query: searchQuery,
          sellerType: sellerTypeFilter,
          sort: sortOption,
          limit: pageSize,
          offset,
        });
        setListings(res.items || []);
        setTotalListingsCount(res.total || 0);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setLoading(false);
      }
    },
    [categoryFilter, searchQuery, sellerTypeFilter, sortOption, currentPage, pageSize]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAggregates(), loadListings(currentPage)]);
    setLoading(false);
  }, [loadAggregates, loadListings, currentPage]);

  useEffect(() => {
    loadAggregates();
  }, [loadAggregates]);

  useEffect(() => {
    setCurrentPage(1);
    loadListings(1);
  }, [categoryFilter, sortOption, sellerTypeFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadListings(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleSortToggle = (field: SortField) => {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadListings(1);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={tab}
        totalListings={stats?.totalListings || 0}
        loading={loading}
        onSelectTab={setTab}
        onRefresh={refreshAll}
      />

      <KpiCards stats={stats} arbitrageCount={arbitrage.length} />

      <main className="flex-1 px-6 pb-8">
        {tab === 'arbitrage' && (
          <ArbitragePage items={arbitrage} loading={loading} />
        )}

        {tab === 'listings' && (
          <ListingsPage
            listings={listings}
            totalCount={totalListingsCount}
            currentPage={currentPage}
            pageSize={pageSize}
            loading={loading}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            sellerTypeFilter={sellerTypeFilter}
            sortOption={sortOption}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onCategoryChange={setCategoryFilter}
            onSellerTypeChange={setSellerTypeFilter}
            onSortChange={setSortOption}
            onSortToggle={handleSortToggle}
            onPageChange={handlePageChange}
          />
        )}

        {tab === 'analytics' && (
          <AnalyticsPage
            neighborhoods={neighborhoods}
            sellersData={sellersData}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />
        )}
      </main>
    </div>
  );
}

export default App;
