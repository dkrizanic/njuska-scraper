import { ArbitrageResponseDto } from '../../dtos/arbitrage/arbitrage-response.dto';

export interface IArbitrageService {
  getArbitrageOpportunities(): Promise<ArbitrageResponseDto[]>;
}
