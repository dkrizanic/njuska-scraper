import { StatsResponseDto } from '../../dtos/stats/stats-response.dto';

export interface IStatsService {
  getPlatformStats(): Promise<StatsResponseDto>;
}
