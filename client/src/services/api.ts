import {
  Stats,
  Listing,
  ArbitrageOpportunity,
  NeighborhoodStat,
  SellersAnalyticsData,
} from '../props';

const API_BASE = 'http://localhost:4000/api';

export interface FetchListingsParams {
  category?: 'all' | 'rent' | 'sale';
  query?: string;
  sellerType?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface ListingsApiResponse {
  total: number;
  items: Listing[];
  page?: number;
  limit?: number;
}

export async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchArbitrage(): Promise<ArbitrageOpportunity[]> {
  const response = await fetch(`${API_BASE}/rental-arbitrage`);
  if (!response.ok) {
    throw new Error(`Failed to fetch arbitrage: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchNeighborhoods(category: 'all' | 'rent' | 'sale' = 'rent'): Promise<NeighborhoodStat[]> {
  const catParam = category === 'all' ? '' : category;
  const response = await fetch(`${API_BASE}/analytics/neighborhoods?category=${catParam}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhood analytics: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSellers(): Promise<SellersAnalyticsData> {
  const response = await fetch(`${API_BASE}/analytics/sellers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch seller analytics: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchListings(params: FetchListingsParams): Promise<ListingsApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params.query) {
    searchParams.set('query', params.query);
  }
  if (params.sellerType) {
    searchParams.set('sellerType', params.sellerType);
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', params.offset.toString());
  }

  const response = await fetch(`${API_BASE}/listings?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`);
  }
  return response.json();
}
