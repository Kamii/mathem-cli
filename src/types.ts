export interface Product {
  id: number;
  full_name: string;
  brand: string;
  brand_id: number;
  name: string;
  name_extra: string;
  front_url: string;
  absolute_url: string;
  gross_price: string;
  gross_unit_price: string;
  unit_price_quantity_abbreviation: string;
  unit_price_quantity_name: string;
  currency: string;
  discount: unknown;
  promotion: Promotion | null;
  promotions: Promotion[];
  availability: Availability;
  images: ProductImage[];
  client_classifiers: Classifier[];
}

export interface Promotion {
  title: string;
  description_short: string;
  accessibility_text: string;
  display_style: string;
}

export interface Availability {
  is_available: boolean;
  description: string;
  description_short: string;
  code: string;
}

export interface ProductImage {
  large: ImageSize;
  thumbnail: ImageSize;
  variant: string;
}

export interface ImageSize {
  url: string;
  width: number;
  height: number;
}

export interface Classifier {
  name: string;
  image_url: string;
  is_important: boolean;
  description: string;
}

export interface SearchItem {
  id: number;
  type: string;
  attributes: Product;
  tracking_properties: Record<string, unknown>;
}

export interface SearchResult {
  type: string;
  attributes: {
    items: number;
    page: number;
    has_more_items: boolean;
    query_string: string;
    filters: string;
  };
  items: SearchItem[];
  filters: SearchFilter[];
}

export interface SearchFilter {
  type: string;
  content_type: string;
  name: string;
  value: string;
  display_value: string;
  count: number;
  active: boolean;
}

export interface SummaryLine {
  description: string;
  long_description: string | null;
  gross_amount: string;
  group_id: number;
  section_id: number;
  name: string;
  display_style: string;
}

export interface SummaryGroup {
  id: string;
  lines: SummaryLine[];
}

export interface CartProduct {
  product: Product;
  quantity: number;
}

export interface Cart {
  id: number;
  active_grouping: string;
  label_text: string;
  product_quantity_count: number;
  display_price: string;
  total_gross_amount: string;
  summary_lines: SummaryGroup[];
  currency: string;
  items?: CartProduct[];
  groups?: unknown[];
}

export interface LoginResponse {
  is_authenticated: boolean;
  sessionid: string;
}

export interface LogoutResponse {
  is_authenticated: boolean;
  sessionid: string;
}

export interface MathemConfig {
  username?: string;
  password?: string;
  baseUrl?: string;
}
