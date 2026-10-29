export interface SellerEntityProps {
  id: number;
  seller_slug: string;
  name: string;
  profile_url?: string | null;
  seller_type?: string | null;
  is_verified?: boolean;
  first_seen_at?: Date | string;
  last_seen_at?: Date | string;
}

export class SellerEntity {
  public id: number;
  public sellerSlug: string;
  public name: string;
  public profileUrl?: string | null;
  public sellerType?: string | null;
  public isVerified: boolean;
  public firstSeenAt: Date;
  public lastSeenAt: Date;

  constructor(props: SellerEntityProps) {
    this.id = props.id;
    this.sellerSlug = props.seller_slug;
    this.name = props.name;
    this.profileUrl = props.profile_url;
    this.sellerType = props.seller_type;
    this.isVerified = Boolean(props.is_verified);
    this.firstSeenAt = props.first_seen_at ? new Date(props.first_seen_at) : new Date();
    this.lastSeenAt = props.last_seen_at ? new Date(props.last_seen_at) : new Date();
  }
}
