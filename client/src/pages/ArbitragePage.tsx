import React from 'react';
import { ArbitrageOpportunity } from '../props';
import { ArbitrageGrid } from '../components/arbitrage/ArbitrageGrid';

interface ArbitragePageProps {
  items: ArbitrageOpportunity[];
  loading: boolean;
}

export const ArbitragePage: React.FC<ArbitragePageProps> = ({ items, loading }) => {
  return <ArbitrageGrid items={items} loading={loading} />;
};
