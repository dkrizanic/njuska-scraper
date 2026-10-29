import { IStatsService } from '../interfaces/services/stats.service.interface';
import { IStatsRepository } from '../interfaces/repositories/stats.repository.interface';
import { StatsRepository } from '../repositories/stats.repository';
import { StatsResponseDto } from '../dtos/stats/stats-response.dto';

export class StatsService implements IStatsService {
  constructor(private readonly statsRepo: IStatsRepository = new StatsRepository()) {}

  public async getPlatformStats(): Promise<StatsResponseDto> {
    const raw = await this.statsRepo.getAggregateStats();
    return StatsResponseDto.fromRaw(raw);
  }
}
