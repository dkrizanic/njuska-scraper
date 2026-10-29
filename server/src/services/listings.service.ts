import { findListings, ListingFilterOptions, ListingRecord } from '../models/listings.model';

export interface ListingsQueryParams {
  category?: string;
  neighborhood?: string;
  sellerType?: string;
  minPrice?: string;
  maxPrice?: string;
  query?: string;
  sort?: string;
  limit?: string;
  offset?: string;
  page?: string;
}

export interface ListingsResult {
  total: number;
  items: ListingRecord[];
  page: number;
  limit: number;
}

export async function getListings(params: ListingsQueryParams): Promise<ListingsResult> {
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '50', 10)));
  const page = params.page ? Math.max(1, parseInt(params.page, 10)) : 1;
  const offset = params.offset ? Math.max(0, parseInt(params.offset, 10)) : (page - 1) * limit;

  const filters: ListingFilterOptions = {
    category: params.category,
    neighborhood: params.neighborhood,
    sellerType: params.sellerType,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    query: params.query?.trim(),
    sort: params.sort || 'newest',
    limit,
    offset,
  };

  const { total, items } = await findListings(filters);

  return {
    total,
    items,
    page: Math.floor(offset / limit) + 1,
    limit,
  };
}
