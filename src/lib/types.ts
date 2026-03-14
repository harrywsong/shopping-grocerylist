export interface FlyerItem {
  id: string | number;
  name: string;
  price: number | null;
  original_price: number | null;
  unit: string | null;
  image_url: string | null;
  cutout_image_url: string | null;
  store_name: string;
  on_sale: boolean;
  savings_percentage: number | null;
  valid_from: string | null;
  valid_to: string | null;
  sale_story: string | null;
}

export interface StoreFlyer {
  id: number;
  name: string;
  merchant_name: string;
  merchant_id?: number | null;
  valid_from: string;
  valid_to: string;
  thumbnail_url: string | null;
  items_count: number;
}

export interface ShoppingListItem {
  id: string;
  flyer_item_id?: string | number | null;
  name: string;
  store_name: string;
  price: number | null;
  image_url: string | null;
  added_at: string;
  checked: boolean;
  quantity: number;
}
