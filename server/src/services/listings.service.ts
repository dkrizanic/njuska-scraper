import { IListingsService } from '../interfaces/services/listing.service.interface';
import { IListingRepository } from '../interfaces/repositories/listing.repository.interface';
import { ListingRepository } from '../repositories/listing.repository';
import { ListingQueryDto } from '../dtos/listing/listing-query.dto';
import { CreateListingDto } from '../dtos/listing/create-listing.dto';
import { ListingResponseDto, PaginatedListingsResponseDto } from '../dtos/listing/listing-response.dto';

export class ListingsService implements IListingsService {
  constructor(private readonly listingRepo: IListingRepository = new ListingRepository()) {}

  public async getListings(queryDto: ListingQueryDto): Promise<PaginatedListingsResponseDto> {
    const { total, entities } = await this.listingRepo.findMany(queryDto);
    const items = entities.map(entity => ListingResponseDto.fromEntity(entity));
    return new PaginatedListingsResponseDto(total, queryDto.page, queryDto.limit, items);
  }

  public async getListingById(id: number): Promise<ListingResponseDto | null> {
    const entity = await this.listingRepo.findById(id);
    if (!entity) return null;
    return ListingResponseDto.fromEntity(entity);
  }

  public async createListing(dto: CreateListingDto): Promise<ListingResponseDto> {
    const entity = await this.listingRepo.create(dto);
    return ListingResponseDto.fromEntity(entity);
  }
}
