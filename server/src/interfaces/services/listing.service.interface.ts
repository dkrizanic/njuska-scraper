import { ListingQueryDto } from '../../dtos/listing/listing-query.dto';
import { CreateListingDto } from '../../dtos/listing/create-listing.dto';
import { ListingResponseDto, PaginatedListingsResponseDto } from '../../dtos/listing/listing-response.dto';

export interface IListingsService {
  getListings(queryDto: ListingQueryDto): Promise<PaginatedListingsResponseDto>;
  getListingById(id: number): Promise<ListingResponseDto | null>;
  createListing(dto: CreateListingDto): Promise<ListingResponseDto>;
}
