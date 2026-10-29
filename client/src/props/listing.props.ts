export interface Listing {
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
  county?: string;
  city?: string;
  neighborhood: string;
  property_type?: string;
  rooms: string;
  floor: string;
  energy_class?: string;
  views_count: number;
  seller_name: string;
  seller_type: string;
  details_scraped: boolean;
  first_seen_at: string;
  last_seen_at: string;
  published_at?: string;
  image_urls: string[];
}

export type SortField = 'price' | 'pm2' | 'area' | 'views';

export interface ListingsTableProps {
  listings: Listing[];
  sortOption: string;
  onSortToggle: (field: SortField) => void;
}

export interface ListingFiltersProps {
  searchQuery: string;
  categoryFilter: 'all' | 'rent' | 'sale';
  sellerTypeFilter: string;
  sortOption: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCategoryChange: (category: 'all' | 'rent' | 'sale') => void;
  onSellerTypeChange: (sellerType: string) => void;
  onSortChange: (sort: string) => void;
}

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}
