import { ListingEntity } from '../../entities/listing.entity';
import { ListingQueryDto } from '../../dtos/listing/listing-query.dto';
import { CreateListingDto } from '../../dtos/listing/create-listing.dto';

export interface IListingRepository {
  findMany(filters: ListingQueryDto): Promise<{ total: number; entities: ListingEntity[] }>;
  findById(id: number): Promise<ListingEntity | null>;
  create(dto: CreateListingDto): Promise<ListingEntity>;
}
