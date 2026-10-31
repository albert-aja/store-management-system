export interface WishlistShareReceipt {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface WishlistShareSummary {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface SharedWishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  primaryImageUrl: string;
  quantity: number;
  reserved: boolean;
}

export interface SharedWishlist {
  createdAt: string;
  expiresAt: string;
  items: SharedWishlistItem[];
}
