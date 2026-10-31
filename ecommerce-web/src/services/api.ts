import axios from 'axios';
import type { SharedWishlist, WishlistShareReceipt, WishlistShareSummary } from '../types/wishlistShare';
import {
  ProductSummary,
  ProductDetail,
  Category,
  Banner,
  Cart,
  PaymentMethod,
  PickupBranch,
  CheckoutResponse,
  OrderDetail,
  CustomerProfile,
  PickupPass,
  StagePickupData,
  VerifyHandoverData,
  HandoverResult,
  DeliverySchedule,
  DeliveryRescheduleRequest,
  WishlistItem,
  WishlistSummary,
} from '../types';

const resolveApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL;
    }
  } catch {
    // Next.js runtime fallback
  }
  return '/api/v1/storefront';
};

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'NEXTJS_WEB',
    'X-App-Client': 'SMS-Ecommerce-NextJS/15',
  },
});

const PUBLIC_API = axios.create({ baseURL: resolveApiBaseUrl() });

export const wishlistShareApi = {
  async create(): Promise<WishlistShareReceipt> {
    return (await API.post<WishlistShareReceipt>('/wishlist/shares')).data;
  },
  async list(): Promise<WishlistShareSummary[]> {
    return (await API.get<WishlistShareSummary[]>('/wishlist/shares')).data;
  },
  async revoke(id: string): Promise<void> {
    await API.delete(`/wishlist/shares/${encodeURIComponent(id)}`);
  },
  async get(token: string, signal?: AbortSignal): Promise<SharedWishlist> {
    return (await PUBLIC_API.get<SharedWishlist>(`/wishlist/share/${encodeURIComponent(token)}`, { signal })).data;
  },
  async reserve(token: string, itemId: string): Promise<{ cancellationKey: string }> {
    return (await PUBLIC_API.post<{ cancellationKey: string }>(
      `/wishlist/share/${encodeURIComponent(token)}/items/${encodeURIComponent(itemId)}/reservation`,
    )).data;
  },
  async cancel(token: string, itemId: string, cancellationKey: string): Promise<void> {
    await PUBLIC_API.delete(`/wishlist/share/${encodeURIComponent(token)}/items/${encodeURIComponent(itemId)}/reservation`, {
      data: { cancellationKey },
    });
  },
};

let accessToken: string | null = null;

export function setStorefrontAccessToken(token: string | null): void {
  accessToken = token;
}

export async function loadCustomerProfile(token: string): Promise<CustomerProfile> {
  const response = await API.post<CustomerProfile>('/auth/session', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Attach session ID and customer ID (safe for SSR and Browser)
API.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  config.headers['X-Client-Platform'] = 'NEXTJS_WEB';
  if (typeof window !== 'undefined' && window.localStorage) {
    let sessionId = localStorage.getItem('sms_cart_session');
    if (!sessionId) {
      sessionId = 'session_' + crypto.randomUUID();
      localStorage.setItem('sms_cart_session', sessionId);
    }
    config.headers['X-Session-ID'] = sessionId;

  }

  return config;
});

// Fallback Mock Data for standalone frontend resilience
const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Elektronik Rumah', code: 'ELEC-HOME', description: 'Kulkas, AC, Mesin Cuci hemat energi', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', productCount: 24 },
  { id: 'cat-2', name: 'Smart TV & Audio', code: 'TV-AUDIO', description: '4K OLED Smart TV & Home Theater', imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80', productCount: 18 },
  { id: 'cat-3', name: 'Furniture & Living', code: 'FURN-LIV', description: 'Sofa elegan, meja makan, dan spring bed', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', productCount: 32 },
  { id: 'cat-4', name: 'Gadget & Komputer', code: 'GADGET', description: 'Smartphone, Laptop, dan Aksesoris resmi', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', productCount: 15 },
];

const MOCK_BANNERS: Banner[] = [
  {
    id: 'b-1',
    title: 'Super Promo Panen Rezeki 2026',
    subtitle: 'Diskon hingga 35% untuk Smart TV 4K & Kulkas Inverter 2 Pintu. Garansi resmi 2 tahun.',
    badgeText: 'PENAWARAN TERBATAS',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/products',
    ctaText: 'Belanja Sekarang',
  },
  {
    id: 'b-2',
    title: 'Dual Fulfillment: Antar Cepat atau Ambil di Toko',
    subtitle: 'Pilih opsi antar langsung oleh armada pengemudi kami atau ambil langsung di cabang showroom terdekat.',
    badgeText: 'FLEKSIBILITAS PENGIRIMAN',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/products',
    ctaText: 'Lihat Layanan',
  },
];

const MOCK_PRODUCTS: ProductSummary[] = [
  {
    id: 'prd-1',
    name: 'Samsung 55" Crystal UHD 4K Smart TV',
    code: 'SAM-TV-55-UHD',
    description: 'Dynamic Crystal Color dengan HDR10+ dan AirSlim Design.',
    brandName: 'Samsung',
    categoryName: 'Smart TV & Audio',
    minPrice: 6899000,
    maxPrice: 7299000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 14,
  },
  {
    id: 'prd-2',
    name: 'Sofa Modular L-Shape Scandinavia Velvet',
    code: 'FURN-SOFA-SCAN',
    description: 'Bahan busa densitas tinggi dengan cover beludru premium anti-noda.',
    brandName: 'Informa / SMS Living',
    categoryName: 'Furniture & Living',
    minPrice: 4250000,
    maxPrice: 4850000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
    leadTimeDays: 4,
    inStockCount: 0,
  },
  {
    id: 'prd-3',
    name: 'LG Kulkas 2 Pintu Inverter Smart Linear 395L',
    code: 'LG-REF-395L',
    description: 'DoorCooling+ dan Hygiene Fresh+ menjaga kesegaran bahan makanan lebih lama.',
    brandName: 'LG Electronics',
    categoryName: 'Elektronik Rumah',
    minPrice: 5499000,
    maxPrice: 5799000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 8,
  },
  {
    id: 'prd-4',
    name: 'Meja Kerja Minimalis Ergonomis Oak Wood',
    code: 'FURN-DESK-OAK',
    description: 'Kayu solid oak dengan rangka baja powder-coated dan manajemen kabel tersembunyi.',
    brandName: 'SMS Living',
    categoryName: 'Furniture & Living',
    minPrice: 1850000,
    maxPrice: 2100000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 19,
  },
  {
    id: 'prd-5',
    name: 'Sharp Air Conditioner 1 PK J-Tech Inverter',
    code: 'SHARP-AC-1PK',
    description: 'Pendinginan cepat JetStream dengan teknologi Plasmacluster Ion pembersih udara.',
    brandName: 'Sharp',
    categoryName: 'Elektronik Rumah',
    minPrice: 3899000,
    maxPrice: 4199000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
    leadTimeDays: 3,
    inStockCount: 0,
  },
  {
    id: 'prd-6',
    name: 'Apple MacBook Air 13" M3 Chip 256GB',
    code: 'AAPL-MBA-M3',
    description: 'Layar Liquid Retina 13.6 inci, daya tahan baterai hingga 18 jam.',
    brandName: 'Apple',
    categoryName: 'Gadget & Komputer',
    minPrice: 17499000,
    maxPrice: 19999000,
    primaryImageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 5,
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', code: 'BANK_TRANSFER_VA', name: 'Virtual Account Bank Transfer', category: 'DIGITAL', description: 'Verifikasi instan otomatis BCA, Mandiri, BRI, BNI Virtual Account', icon: 'landmark', enabled: true, requiresApproval: false, displayOrder: 1 },
  { id: 'pm-2', code: 'QRIS', name: 'QRIS Dynamic QR', category: 'DIGITAL', description: 'Scan cepat menggunakan BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay', icon: 'qr-code', enabled: true, requiresApproval: false, displayOrder: 2 },
  { id: 'pm-3', code: 'E_WALLET', name: 'E-Wallet (GoPay / OVO / ShopeePay)', category: 'DIGITAL', description: 'Pembayaran praktis langsung dari aplikasi e-wallet Anda', icon: 'wallet', enabled: true, requiresApproval: false, displayOrder: 3 },
  { id: 'pm-4', code: 'CREDIT_CARD', name: 'Kartu Kredit / Debit Online', category: 'DIGITAL', description: 'Visa, Mastercard, JCB dengan pengamanan 3D Secure OTP', icon: 'credit-card', enabled: true, requiresApproval: false, displayOrder: 4 },
  { id: 'pm-5', code: 'CASH_STORE', name: 'Bayar Tunai di Kasir Toko Showroom', category: 'CASH', description: 'Selesaikan transaksi langsung di kasir toko saat mengambil barang', icon: 'banknote', enabled: true, requiresApproval: false, displayOrder: 5 },
  { id: 'pm-6', code: 'DIRECT_STORE_TRANSFER', name: 'Transfer Langsung ke Rekening Toko', category: 'CASH', description: 'Transfer manual ke rekening korporat resmi toko dengan upload bukti transfer', icon: 'building-2', enabled: true, requiresApproval: false, displayOrder: 6 },
  { id: 'pm-7', code: 'COD_DRIVER', name: 'Cash on Delivery (Kurir Toko Kami)', category: 'CASH', description: 'Bayar tunai pas langsung kepada kurir pengemudi resmi toko saat barang sampai', icon: 'truck', enabled: true, requiresApproval: false, displayOrder: 7 },
  { id: 'pm-8', code: 'IN_HOUSE_CREDIT', name: 'Fasilitas Cicilan In-House Toko', category: 'CREDIT', description: 'Skema cicilan toko bersahabat (memerlukan survei kredit & verifikasi limit)', icon: 'file-text', enabled: true, requiresApproval: true, displayOrder: 8 },
  { id: 'pm-9', code: 'THIRD_PARTY_FINANCING', name: 'Cicilan Fintech (Kredivo / Akulaku)', category: 'FINANCING', description: 'Persetujuan instan & tenor fleksibel hingga 12 bulan via mitra pembiayaan resmi', icon: 'shield-check', enabled: true, requiresApproval: false, displayOrder: 9 },
];

const MOCK_BRANCHES: PickupBranch[] = [
  { id: 'br-1', code: 'STR-JKT-01', name: 'SMS Mart Flagship Showroom Jakarta Pusat', address: 'Jl. Jenderal Sudirman No. 42, Jakarta Pusat', active: true },
  { id: 'br-2', code: 'STR-SBY-02', name: 'SMS Mart Superstore Surabaya Timur', address: 'Jl. Manyar Kertoarjo No. 88, Surabaya', active: true },
  { id: 'br-3', code: 'STR-BDG-03', name: 'SMS Mart Megastore Bandung Dago', address: 'Jl. Ir. H. Juanda No. 120, Bandung', active: true },
];

export const storefrontApi = {
  async getDeliverySchedules(orderId: string): Promise<DeliverySchedule[]> {
    const response = await API.get<DeliverySchedule[]>(`/delivery-schedules/orders/${encodeURIComponent(orderId)}`);
    return response.data;
  },

  async requestDeliveryReschedule(deliveryOrderId: string, input: {
    requestedDate: string; requestedWindow: "MORNING" | "AFTERNOON"; reason?: string;
  }): Promise<DeliveryRescheduleRequest> {
    const response = await API.post<DeliveryRescheduleRequest>(
      `/delivery-schedules/${encodeURIComponent(deliveryOrderId)}/requests`, input,
    );
    return response.data;
  },
  async getBanners(): Promise<Banner[]> {
    try {
      const res = await API.get('/banners');
      return res.data && res.data.length > 0 ? res.data : MOCK_BANNERS;
    } catch {
      return MOCK_BANNERS;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await API.get('/categories');
      return res.data && res.data.length > 0 ? res.data : MOCK_CATEGORIES;
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  async getProducts(params?: {
    query?: string;
    categoryId?: string;
    brandId?: string;
    availability?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ProductSummary[]> {
    try {
      const res = await API.get('/products', { params });
      return res.data && res.data.length > 0 ? res.data : MOCK_PRODUCTS;
    } catch {
      let filtered = [...MOCK_PRODUCTS];
      if (params?.query) {
        const q = params.query.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
      }
      if (params?.availability && params.availability !== 'ALL') {
        filtered = filtered.filter(p => p.commercialAvailability === params.availability);
      }
      return filtered;
    }
  },

  async getProductDetail(id: string): Promise<ProductDetail> {
    try {
      const res = await API.get(`/products/${id}`);
      return res.data;
    } catch {
      const p = MOCK_PRODUCTS.find(x => x.id === id) || MOCK_PRODUCTS[0];
      return {
        ...p,
        imageUrls: [
          p.primaryImageUrl,
          'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
        ],
        totalStockCount: p.inStockCount,
        variants: [
          {
            id: p.id + '-v1',
            name: 'Pilihan Standar (Warna Hitam / Default)',
            sku: p.code + '-STD',
            price: p.minPrice,
            stockCount: p.inStockCount,
            commercialAvailability: p.commercialAvailability,
            leadTimeDays: p.leadTimeDays,
            attributes: { Warna: 'Default', Garansi: 'Resmi' },
          },
          {
            id: p.id + '-v2',
            name: 'Pilihan Edisi Khusus (Silver / Deluxe)',
            sku: p.code + '-DLX',
            price: p.maxPrice,
            stockCount: 0,
            commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
            leadTimeDays: 4,
            attributes: { Warna: 'Silver Deluxe', Garansi: 'Resmi' },
          },
        ],
        specifications: {
          Brand: p.brandName,
          Kategori: p.categoryName,
          'Kode Model': p.code,
          'Garansi Resmi': '1 Tahun Distributor Resmi Indonesia',
          'Cakupan Pengiriman': 'Armada Kurir Toko & Ambil di Cabang',
        },
      };
    }
  },

  async getCart(): Promise<Cart> {
    try {
      const res = await API.get('/cart');
      return res.data;
    } catch {
      const local = localStorage.getItem('sms_mock_cart');
      if (local) return JSON.parse(local);
      return {
        cartId: 'local-cart',
        items: [],
        totalItemCount: 0,
        subtotalAmount: 0,
        estimatedTax: 0,
        totalAmount: 0,
      };
    }
  },

  async addToCart(variantId: string, quantity: number, fallbackProduct?: Partial<ProductSummary>): Promise<Cart> {
    try {
      const res = await API.post('/cart/items', { variantId, quantity });
      return res.data;
    } catch {
      // Local cart management
      const current = await this.getCart();
      const existing = current.items.find(i => i.variantId === variantId);
      const unitPrice = fallbackProduct?.minPrice || 3500000;
      if (existing) {
        existing.quantity += quantity;
        existing.subtotal = existing.quantity * existing.unitPrice;
      } else {
        current.items.push({
          itemId: 'item-' + Math.random().toString(36).substring(2, 9),
          variantId,
          productName: fallbackProduct?.name || 'Produk Pilihan',
          variantName: 'Pilihan Standar',
          sku: fallbackProduct?.code || 'SKU-ONL',
          unitPrice,
          quantity,
          subtotal: quantity * unitPrice,
          imageUrl: fallbackProduct?.primaryImageUrl || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
          commercialAvailability: fallbackProduct?.commercialAvailability || 'IN_STOCK',
        });
      }
      current.totalItemCount = current.items.reduce((s, i) => s + i.quantity, 0);
      current.subtotalAmount = current.items.reduce((s, i) => s + i.subtotal, 0);
      current.estimatedTax = Math.round(current.subtotalAmount * 0.11);
      current.totalAmount = current.subtotalAmount + current.estimatedTax;
      localStorage.setItem('sms_mock_cart', JSON.stringify(current));
      return current;
    }
  },

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      const res = await API.put(`/cart/items/${itemId}?quantity=${quantity}`);
      return res.data;
    } catch {
      const current = await this.getCart();
      if (quantity <= 0) {
        current.items = current.items.filter(i => i.itemId !== itemId);
      } else {
        const it = current.items.find(i => i.itemId === itemId);
        if (it) {
          it.quantity = quantity;
          it.subtotal = it.quantity * it.unitPrice;
        }
      }
      current.totalItemCount = current.items.reduce((s, i) => s + i.quantity, 0);
      current.subtotalAmount = current.items.reduce((s, i) => s + i.subtotal, 0);
      current.estimatedTax = Math.round(current.subtotalAmount * 0.11);
      current.totalAmount = current.subtotalAmount + current.estimatedTax;
      localStorage.setItem('sms_mock_cart', JSON.stringify(current));
      return current;
    }
  },

  async removeCartItem(itemId: string): Promise<Cart> {
    try {
      const res = await API.delete(`/cart/items/${itemId}`);
      return res.data;
    } catch {
      return this.updateCartItem(itemId, 0);
    }
  },

  async clearCart(): Promise<void> {
    try {
      await API.delete('/cart');
    } catch {
      localStorage.removeItem('sms_mock_cart');
    }
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const res = await API.get('/checkout/payment-methods');
      return res.data && res.data.length > 0 ? res.data : MOCK_PAYMENT_METHODS;
    } catch {
      return MOCK_PAYMENT_METHODS;
    }
  },

  async getPickupBranches(): Promise<PickupBranch[]> {
    try {
      const res = await API.get('/checkout/pickup-branches');
      return res.data && res.data.length > 0 ? res.data : MOCK_BRANCHES;
    } catch {
      return MOCK_BRANCHES;
    }
  },

  async checkout(payload: any): Promise<CheckoutResponse> {
    try {
      const res = await API.post('/checkout', payload);
      this.clearCart();
      return res.data;
    } catch {
      // Local simulated checkout response with dual-axis fulfillment
      const cart = await this.getCart();
      const orderNum = 'SO-WEB-' + Math.floor(100000 + Math.random() * 900000);
      const hasIndent = cart.items.some(i => i.commercialAvailability !== 'IN_STOCK');
      const deposit = hasIndent ? Math.round(cart.totalAmount * 0.3) : cart.totalAmount;

      const groups: any[] = [];
      if (payload.fulfillmentPreference === 'PARTIAL' && hasIndent) {
        // Two groups
        groups.push({
          groupId: 'grp-1',
          groupNumber: 1,
          fulfillmentMethod: payload.fulfillmentMethod || 'DELIVERY',
          status: 'READY_FOR_PACKING',
          pickupStoreName: 'Central Showroom',
          estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
          items: cart.items.filter(i => i.commercialAvailability === 'IN_STOCK').map(i => ({
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            isProcurementRequired: false,
            procurementStatus: 'READY_IN_STOCK',
          })),
        });
        groups.push({
          groupId: 'grp-2',
          groupNumber: 2,
          fulfillmentMethod: payload.fulfillmentMethod || 'DELIVERY',
          status: 'AWAITING_PROCUREMENT',
          pickupStoreName: 'Central Showroom',
          estimatedDeliveryDate: new Date(Date.now() + 345600000).toISOString(),
          items: cart.items.filter(i => i.commercialAvailability !== 'IN_STOCK').map(i => ({
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            isProcurementRequired: true,
            procurementStatus: 'AWAITING_DEPOSIT',
          })),
        });
      } else {
        groups.push({
          groupId: 'grp-1',
          groupNumber: 1,
          fulfillmentMethod: payload.fulfillmentMethod || 'DELIVERY',
          status: hasIndent ? 'AWAITING_PROCUREMENT' : 'READY_FOR_PACKING',
          pickupStoreName: 'Central Showroom',
          estimatedDeliveryDate: new Date(Date.now() + (hasIndent ? 432000000 : 86400000)).toISOString(),
          items: cart.items.map(i => ({
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            isProcurementRequired: i.commercialAvailability !== 'IN_STOCK',
            procurementStatus: i.commercialAvailability !== 'IN_STOCK' ? 'AWAITING_DEPOSIT' : 'READY_IN_STOCK',
          })),
        });
      }

      this.clearCart();

      const resp: CheckoutResponse = {
        orderId: 'ord-' + Math.random().toString(36).substring(2, 9),
        orderNumber: orderNum,
        orderStatus: 'CONFIRMED',
        totalAmount: cart.totalAmount || 7500000,
        requiredDepositAmount: deposit,
        depositPaid: false,
        paymentMethod: payload.paymentMethod || 'QRIS',
        paymentInstructions: {
          method: payload.paymentMethod || 'QRIS',
          qrCodeString: '00020101021226680016ID.CO.SMSMART.WWW011893600914' + orderNum + '520458125303360540' + deposit + '5802ID5914SMS_MART_STORE6007JAKARTA6304ABCD',
          vaNumber: '8808' + Math.floor(10000000 + Math.random() * 90000000),
          bankName: 'BCA Virtual Account',
          amountDue: deposit,
          expiryTime: new Date(Date.now() + 86400000).toISOString(),
          instructions: 'Selesaikan pembayaran sebelum batas waktu berakhir untuk verifikasi otomatis.',
        },
        fulfillmentPreference: payload.fulfillmentPreference || 'COMPLETE',
        fulfillmentGroups: groups,
      };

      // Store in mock orders
      const stored = JSON.parse(localStorage.getItem('sms_mock_orders') || '[]');
      stored.unshift(resp);
      localStorage.setItem('sms_mock_orders', JSON.stringify(stored));

      return resp;
    }
  },

  async getOrder(orderIdOrNumber: string): Promise<OrderDetail> {
    try {
      const path = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orderIdOrNumber)
        ? `/orders/${encodeURIComponent(orderIdOrNumber)}`
        : `/orders/number/${encodeURIComponent(orderIdOrNumber)}`;
      const res = await API.get(path);
      return res.data;
    } catch {
      const stored = JSON.parse(localStorage.getItem('sms_mock_orders') || '[]');
      const found = stored.find((o: any) => o.orderId === orderIdOrNumber || o.orderNumber === orderIdOrNumber);
      if (found) {
        return {
          ...found,
          createdAt: new Date().toISOString(),
          status: found.orderStatus,
          customerName: 'Pelanggan Setia SMS',
          customerPhone: '08123456789',
          deliveryAddressSnapshot: 'Jl. Sudirman No. 42, Jakarta Pusat',
          timeline: [
            { milestone: 'ORDER_PLACED', description: 'Pesanan Diterima Sistem', timestamp: new Date().toISOString(), completed: true },
            { milestone: 'PAYMENT_CONFIRMED', description: 'Uang Muka / Pelunasan Terkonfirmasi', timestamp: new Date(Date.now() + 600000).toISOString(), completed: found.depositPaid },
            { milestone: 'PREPARATION', description: 'Pemeriksaan Barang & Alokasi Gudang', timestamp: new Date(Date.now() + 3600000).toISOString(), completed: found.depositPaid },
            { milestone: 'DISPATCHED', description: 'Pengiriman Armada Kurir Toko / Siap Ambil', timestamp: new Date(Date.now() + 86400000).toISOString(), completed: false },
            { milestone: 'COMPLETED', description: 'Pesanan Selesai Diterima', timestamp: new Date(Date.now() + 172800000).toISOString(), completed: false },
          ],
        };
      }
      throw new Error('Pesanan tidak ditemukan');
    }
  },

  async simulatePayment(orderId: string): Promise<OrderDetail> {
    try {
      const res = await API.post(`/orders/${orderId}/pay`);
      return res.data;
    } catch {
      const stored = JSON.parse(localStorage.getItem('sms_mock_orders') || '[]');
      const found = stored.find((o: any) => o.orderId === orderId || o.orderNumber === orderId);
      if (found) {
        found.depositPaid = true;
        found.fulfillmentGroups.forEach((g: any) => {
          if (g.status === 'AWAITING_PROCUREMENT') g.status = 'READY_FOR_PACKING';
        });
        localStorage.setItem('sms_mock_orders', JSON.stringify(stored));
        return this.getOrder(orderId);
      }
      throw new Error('Gagal memproses simulasi pembayaran');
    }
  },

  async getPickupPass(orderNumber: string): Promise<PickupPass> {
    try {
      const res = await API.get(`/pickup/pass/${orderNumber}`);
      return res.data;
    } catch {
      const stored = JSON.parse(localStorage.getItem('sms_mock_orders') || '[]');
      const found = stored.find((o: any) => o.orderNumber === orderNumber || o.orderId === orderNumber);
      return {
        orderNumber: orderNumber,
        fulfillmentGroupId: 'fg-mock-pickup',
        groupNumber: 1,
        pickupStoreId: 'store-1',
        pickupStoreCode: 'SHOWROOM-CENTRAL',
        pickupStoreName: 'SMS Mart Flagship Showroom Central',
        pickupStoreAddress: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
        operatingHours: 'Senin - Minggu: 09:00 - 21:00 WIB',
        contactPhone: '+62 21 555-0199',
        pickupPassCode: 'PKP-8921-9988',
        qrPayload: `SMS-PICKUP:${orderNumber}:1:PKP-8921-9988`,
        stagingStatus: found && found.depositPaid ? 'READY_FOR_PICKUP' : 'AWAITING_STAGING',
        stagingRackLocation: 'Rak Display A-03 (Showroom Utama)',
        stagedAt: new Date().toISOString(),
        recipientName: found ? found.customerName : 'Pelanggan Setia SMS',
        recipientPhone: found ? found.customerPhone : '08123456789',
        totalAmount: found ? found.totalAmount : 1500000,
        requiredDepositAmount: found ? found.requiredDepositAmount : 450000,
        depositPaid: found ? found.depositPaid : true,
        remainingBalance: found && found.depositPaid ? Math.max(0, found.totalAmount - found.requiredDepositAmount) : 1500000,
        fullyPaid: found && found.depositPaid && found.requiredDepositAmount >= found.totalAmount,
        readyForCollection: true,
        items: found && found.fulfillmentGroups?.[0]?.items ? found.fulfillmentGroups[0].items : [
          { productName: 'Smart TV LED 55 Inch 4K UHD', variantName: 'Black 4K', sku: 'TV-55-BLK', quantity: 1, procurementRequired: false }
        ],
      };
    }
  },

  async stagePickup(data: StagePickupData): Promise<PickupPass> {
    try {
      const res = await API.post('/pickup/stage', data);
      return res.data;
    } catch {
      const pass = await this.getPickupPass(data.orderNumber);
      pass.stagingStatus = 'READY_FOR_PICKUP';
      pass.stagingRackLocation = data.stagingRackLocation;
      pass.stagedAt = new Date().toISOString();
      pass.readyForCollection = true;
      return pass;
    }
  },

  async verifyHandover(data: VerifyHandoverData): Promise<HandoverResult> {
    try {
      const res = await API.post('/pickup/verify-handover', data);
      return res.data;
    } catch {
      return {
        success: true,
        orderNumber: data.pickupPassCode.includes('SO-') ? data.pickupPassCode : 'SO-WEB-999888',
        groupNumber: 1,
        fulfillmentGroupId: 'fg-mock-pickup',
        pickupPassCode: data.pickupPassCode,
        handedOverAt: new Date().toISOString(),
        staffEmployeeName: data.staffEmployeeName,
        customerName: data.recipientIdentityName || 'Pelanggan',
        recipientIdentityName: data.recipientIdentityName || 'Pelanggan',
        settledAmount: data.settleRemainingBalance ? 1050000 : 0,
        message: 'Verifikasi serah terima pesanan berhasil diselesaikan.',
      };
    }
  },

  // ================= Wishlist & Saved Items (P.16) =================
  async getWishlist(): Promise<WishlistSummary> {
    try {
      const res = await API.get('/wishlist');
      return res.data;
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      return getMockWishlistSummary();
    }
  },

  async addToWishlist(productId: string, variantId?: string, currentPrice?: number, notes?: string): Promise<WishlistItem> {
    try {
      const res = await API.post('/wishlist/items', {
        productId,
        variantId,
        currentPrice,
        notes,
      });
      return res.data;
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      const existingIdx = _mockWishlistItems.findIndex((i) => i.productId === productId);
      if (existingIdx !== -1) {
        if (notes) _mockWishlistItems[existingIdx].notes = notes;
        return _mockWishlistItems[existingIdx];
      }

      const prod = MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0];
      const initialPrice = currentPrice || prod.minPrice;
      const newItem: WishlistItem = {
        id: 'wl-' + Math.random().toString(36).substring(2, 9),
        productId: prod.id,
        variantId: variantId || 'var-default',
        productName: prod.name,
        variantName: 'Pilihan Standar Resmi',
        sku: prod.code,
        categoryName: prod.categoryName,
        brandName: prod.brandName,
        primaryImageUrl: prod.primaryImageUrl,
        commercialAvailability: prod.commercialAvailability,
        leadTimeDays: prod.leadTimeDays,
        inStockCount: prod.inStockCount,
        originalAddedPrice: initialPrice,
        currentPrice: initialPrice,
        hasPriceDrop: false,
        priceDropAmount: 0,
        priceDropPercentage: 0,
        notes: notes || 'Item tersimpan impian',
        addedAt: new Date().toISOString(),
      };
      _mockWishlistItems.unshift(newItem);
      return newItem;
    }
  },

  async removeFromWishlist(itemId: string): Promise<void> {
    try {
      await API.delete(`/wishlist/items/${itemId}`);
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      _mockWishlistItems = _mockWishlistItems.filter((i) => i.id !== itemId);
    }
  },

  async removeFromWishlistByProduct(productId: string): Promise<void> {
    try {
      await API.delete(`/wishlist/products/${productId}`);
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      _mockWishlistItems = _mockWishlistItems.filter((i) => i.productId !== productId);
    }
  },

  async isWishlisted(productId: string): Promise<{ wishlisted: boolean; itemId?: string }> {
    try {
      const res = await API.get(`/wishlist/check/${productId}`);
      return res.data;
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      const item = _mockWishlistItems.find((i) => i.productId === productId);
      return { wishlisted: !!item, itemId: item?.id };
    }
  },

  async moveToCartFromWishlist(itemId: string): Promise<Cart> {
    try {
      const res = await API.post(`/wishlist/items/${itemId}/move-to-cart`);
      return res.data;
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      const item = _mockWishlistItems.find((i) => i.id === itemId);
      if (item) {
        await this.addToCart(item.productId, 1);
        _mockWishlistItems = _mockWishlistItems.filter((i) => i.id !== itemId);
      }
      return this.getCart();
    }
  },

  async syncWishlist(customerId: string): Promise<WishlistSummary> {
    const guestSessionId = localStorage.getItem('sms_cart_session') || '';
    const res = await API.post('/wishlist/sync', { guestSessionId, customerId });
    return res.data;
  },

  async simulatePriceDrop(itemId: string, newPrice?: number): Promise<WishlistItem> {
    try {
      const res = await API.post(`/wishlist/items/${itemId}/simulate-price-drop`, {
        newPrice,
      });
      return res.data;
    } catch (error) {
      if (accessToken || (axios.isAxiosError(error) && error.response)) throw error;
      const item = _mockWishlistItems.find((i) => i.id === itemId);
      if (!item) throw new Error('Item not found');
      const targetPrice = newPrice || Math.round(item.originalAddedPrice * 0.85);
      item.currentPrice = targetPrice;
      item.hasPriceDrop = targetPrice < item.originalAddedPrice;
      item.priceDropAmount = Math.max(0, item.originalAddedPrice - targetPrice);
      item.priceDropPercentage = Number(((item.priceDropAmount / item.originalAddedPrice) * 100).toFixed(1));
      return item;
    }
  },
};

// Initial Mock Wishlist State with Price Drop Demonstration
let _mockWishlistItems: WishlistItem[] = [
  {
    id: 'wl-tv-55',
    productId: 'prd-1',
    variantId: 'var-tv-55',
    productName: 'Samsung 55" Crystal UHD 4K Smart TV',
    variantName: 'Black Edition 4K',
    sku: 'SAM-TV-55-UHD',
    categoryName: 'Smart TV & Audio',
    brandName: 'Samsung',
    primaryImageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 14,
    originalAddedPrice: 7499000,
    currentPrice: 6899000,
    hasPriceDrop: true,
    priceDropAmount: 600000,
    priceDropPercentage: 8.0,
    notes: 'Rencana pasang di ruang keluarga saat liburan',
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'wl-sofa-velvet',
    productId: 'prd-2',
    variantId: 'var-sofa-l',
    productName: 'Sofa Modular L-Shape Scandinavia Velvet',
    variantName: 'Velvet Midnight Blue',
    sku: 'FURN-SOFA-01',
    categoryName: 'Furniture & Living',
    brandName: 'SMS Living',
    primaryImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
    commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
    leadTimeDays: 4,
    inStockCount: 0,
    originalAddedPrice: 4250000,
    currentPrice: 4250000,
    hasPriceDrop: false,
    priceDropAmount: 0,
    priceDropPercentage: 0,
    notes: 'Kombinasi warna cocok dengan cat tembok',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

function getMockWishlistSummary(): WishlistSummary {
  const priceDropCount = _mockWishlistItems.filter((i) => i.hasPriceDrop).length;
  const totalPotentialSavings = _mockWishlistItems.reduce((acc, i) => acc + (i.hasPriceDrop ? i.priceDropAmount : 0), 0);
  return {
    items: [..._mockWishlistItems],
    totalItems: _mockWishlistItems.length,
    priceDropCount,
    totalPotentialSavings,
  };
}
