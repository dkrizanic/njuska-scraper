export class PriceChangeResponseDto {
  public id: number;
  public njuskalo_id: string;
  public title: string;
  public url: string;
  public neighborhood: string;
  public category_name: string;
  public initial_price: number;
  public current_price: number;
  public diff_eur: number;
  public diff_pct: number;
  public first_recorded: string;
  public last_recorded: string;

  constructor(data: PriceChangeResponseDto) {
    this.id = data.id;
    this.njuskalo_id = data.njuskalo_id;
    this.title = data.title;
    this.url = data.url;
    this.neighborhood = data.neighborhood;
    this.category_name = data.category_name;
    this.initial_price = data.initial_price;
    this.current_price = data.current_price;
    this.diff_eur = data.diff_eur;
    this.diff_pct = data.diff_pct;
    this.first_recorded = data.first_recorded;
    this.last_recorded = data.last_recorded;
  }

  public static fromRow(row: Record<string, any>): PriceChangeResponseDto {
    return new PriceChangeResponseDto({
      id: Number(row.id),
      njuskalo_id: String(row.njuskalo_id),
      title: String(row.title),
      url: String(row.url),
      neighborhood: row.neighborhood || 'Zagreb',
      category_name: row.category_name || '',
      initial_price: parseFloat(row.initial_price),
      current_price: parseFloat(row.current_price),
      diff_eur: parseFloat(row.diff_eur),
      diff_pct: parseFloat(row.diff_pct),
      first_recorded: row.first_recorded,
      last_recorded: row.last_recorded,
    });
  }
}
