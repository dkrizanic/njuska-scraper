import { fetchPlatformStats, PlatformStats } from '../models/stats.model';

export async function getStats(): Promise<PlatformStats> {
  return fetchPlatformStats();
}
