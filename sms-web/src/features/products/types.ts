export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  description: string | null;
  active: boolean;
}

export interface ProductInput {
  name: string;
  categoryId?: string;
  brandId?: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  variantName: string;
  active: boolean;
}

export interface VariantInput {
  sku: string;
  variantName: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  typeName: string | null;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
}

export interface ProductComponent {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  active: boolean;
}

export interface ComponentInput {
  name: string;
  quantity: number;
  notes?: string;
}
