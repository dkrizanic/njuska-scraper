export interface IStatsRepository {
  getAggregateStats(): Promise<Record<string, any>>;
}
