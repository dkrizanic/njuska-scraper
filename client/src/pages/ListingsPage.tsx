import React from 'react';
import { Listing, SortField } from '../props';
import { ListingFilters } from '../components/listings/ListingFilters';
import { ListingsTable } from '../components/listings/ListingsTable';
import { Pagination } from '../components/listings/Pagination';

interface ListingsPageProps {
  listings: Listing[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  searchQuery: string;
  categoryFilter: 'all' | 'rent' | 'sale';
  sellerTypeFilter: string;
  sortOption: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCategoryChange: (category: 'all' | 'rent' | 'sale') => void;
  onSellerTypeChange: (sellerType: string) => void;
  onSortChange: (sort: string) => void;
  onSortToggle: (field: SortField) => void;
  onPageChange: (page: number) => void;
}

export const ListingsPage: React.FC<ListingsPageProps> = ({
  listings,
  totalCount,
  currentPage,
  pageSize,
  loading,
  searchQuery,
  categoryFilter,
  sellerTypeFilter,
  sortOption,
  onSearchChange,
  onSearchSubmit,
  onCategoryChange,
  onSellerTypeChange,
  onSortChange,
  onSortToggle,
  onPageChange,
}) => {
  return (
    <div className="space-y-4">
      <ListingFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        sellerTypeFilter={sellerTypeFilter}
        sortOption={sortOption}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        onCategoryChange={onCategoryChange}
        onSellerTypeChange={onSellerTypeChange}
        onSortChange={onSortChange}
      />

      {loading && listings.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-slate-900/40 rounded-xl border border-slate-800">
          Učitavanje stanova...
        </div>
      ) : (
        <div className="flex flex-col">
          <ListingsTable
            listings={listings}
            sortOption={sortOption}
            onSortToggle={onSortToggle}
          />
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalCount}
            loading={loading}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
