/** Shared domain types for hauls (DB shape + client working shape). */

export interface HaulItem {
  id?: string;
  name: string;
  product_url: string;
  cny_price: number;
  qty: number;
  weight_grams: number;
  category: string;
  agent: string;
  shipping_line: string;
  qc_photo_url: string;
  notes: string;
  sort_order?: number;
}

export interface Haul {
  id?: string;
  owner_email?: string;
  title: string;
  slug?: string;
  destination_country: string;
  currency: string;
  fx_rate: number;
  agent: string;
  shipping_line?: string;
  is_public: boolean;
  cover_image_url?: string | null;
  notes?: string;
  items: HaulItem[];
  created_at?: string;
  updated_at?: string;
}

export function emptyItem(agent = 'kakobuy'): HaulItem {
  return {
    name: '',
    product_url: '',
    cny_price: 0,
    qty: 1,
    weight_grams: 0,
    category: '',
    agent,
    shipping_line: '',
    qc_photo_url: '',
    notes: '',
  };
}
