export interface PriceHistoryEntityProps {
  id: number;
  listing_id: number;
  price_eur: number;
  price_per_m2_eur?: number | null;
  recorded_at?: Date | string;
}

export class PriceHistoryEntity {
  public id: number;
  public listingId: number;
  public priceEur: number;
  public pricePerM2Eur?: number | null;
  public recordedAt: Date;

  constructor(props: PriceHistoryEntityProps) {
    this.id = props.id;
    this.listingId = props.listing_id;
    this.priceEur = Number(props.price_eur);
    this.pricePerM2Eur = props.price_per_m2_eur != null ? Number(props.price_per_m2_eur) : null;
    this.recordedAt = props.recorded_at ? new Date(props.recorded_at) : new Date();
  }
}
