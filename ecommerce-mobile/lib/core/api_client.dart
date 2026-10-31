import 'dart:convert';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product_model.dart';
import '../models/cart_model.dart';
import '../models/checkout_model.dart';
import '../models/order_model.dart';
import '../models/notification_model.dart';
import '../models/pickup_model.dart';
import '../models/wishlist_model.dart';
import '../models/customer_profile.dart';
import '../models/delivery_schedule_model.dart';
import '../models/wishlist_share_model.dart';
import 'wishlist_share_links.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;
  late final Dio _publicDio;
  String? _accessToken;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://10.0.2.2:8080/api/v1/storefront',
        ),
        connectTimeout: const Duration(seconds: 3),
        receiveTimeout: const Duration(seconds: 3),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'FLUTTER_MOBILE',
          'X-App-Client': 'SMS-Ecommerce-Flutter/3.44',
        },
      ),
    );
    _publicDio = Dio(
      _dio.options.copyWith(headers: {'Content-Type': 'application/json'}),
    );
    _configureSession();
  }

  ApiClient.withTransport(Dio authenticated, Dio anonymous) {
    _dio = authenticated;
    _publicDio = anonymous;
    _configureSession();
  }

  void _configureSession() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            options.headers['X-Session-ID'] = await _cartSessionId();
            if (_accessToken != null &&
                !options.headers.containsKey('Authorization')) {
              options.headers['Authorization'] = 'Bearer $_accessToken';
            }
            handler.next(options);
          } catch (error) {
            handler.reject(DioException(requestOptions: options, error: error));
          }
        },
      ),
    );
  }

  void setAccessToken(String? token) => _accessToken = token;

  Future<WishlistShare> createWishlistShare() async {
    final response = await _dio.post('/wishlist/shares', data: {});
    return WishlistShare.fromJson(Map<String, dynamic>.from(response.data));
  }

  Future<List<WishlistShare>> getWishlistShares() async {
    final response = await _dio.get('/wishlist/shares');
    return (response.data as List)
        .map((item) => WishlistShare.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<void> revokeWishlistShare(String id) async {
    await _dio.delete('/wishlist/shares/${Uri.encodeComponent(id)}');
  }

  String _sharedPath(String token) {
    if (!WishlistShareLinks.safeToken(token)) {
      throw const FormatException('Invalid share token');
    }
    return '/wishlist/share/$token';
  }

  Future<SharedWishlist> getSharedWishlist(String token) async {
    final response = await _publicDio.get(_sharedPath(token));
    return SharedWishlist.fromJson(Map<String, dynamic>.from(response.data));
  }

  Future<ProductSummary> getProductById(String productId) async {
    final response = await _dio.get(
      '/products/${Uri.encodeComponent(productId)}',
    );
    final data = Map<String, dynamic>.from(response.data);
    final images = data['imageUrls'] as List?;
    final variants = data['variants'] as List?;
    return ProductSummary.fromJson({
      ...data,
      'primaryImageUrl': images != null && images.isNotEmpty ? images.first : '',
      'primaryVariantId': variants != null && variants.isNotEmpty
          ? (variants.first as Map)['id']
          : null,
      'inStockCount': data['totalStockCount'],
    });
  }

  Future<String> reserveSharedWishlistItem(String token, String itemId) async {
    final response = await _publicDio.post(
      '${_sharedPath(token)}/items/${Uri.encodeComponent(itemId)}/reservation',
      data: {},
    );
    final key = (response.data as Map)['cancellationKey'];
    if (key is! String || key.isEmpty) {
      throw const FormatException('Missing cancellation key');
    }
    return key;
  }

  Future<void> cancelSharedWishlistReservation(
    String token,
    String itemId,
    String cancellationKey,
  ) async {
    if (cancellationKey.isEmpty) {
      throw const FormatException('Missing cancellation key');
    }
    await _publicDio.delete(
      '${_sharedPath(token)}/items/${Uri.encodeComponent(itemId)}/reservation',
      data: {'cancellationKey': cancellationKey},
    );
  }

  Future<List<DeliverySchedule>> getDeliverySchedules(String orderId) async {
    final response = await _dio.get(
      '/delivery-schedules/orders/${Uri.encodeComponent(orderId)}',
    );
    return (response.data as List)
        .map(
          (item) =>
              DeliverySchedule.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<DeliveryRescheduleRequest> requestDeliveryReschedule(
    String deliveryOrderId, {
    required String requestedDate,
    required String requestedWindow,
    String? reason,
  }) async {
    final response = await _dio.post(
      '/delivery-schedules/${Uri.encodeComponent(deliveryOrderId)}/requests',
      data: {
        'requestedDate': requestedDate,
        'requestedWindow': requestedWindow,
        'reason': reason,
      },
    );
    return DeliveryRescheduleRequest.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<CustomerProfile> loadCustomerProfile(String token) async {
    final response = await _dio.post(
      '/auth/session',
      data: {},
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        receiveTimeout: const Duration(seconds: 20),
      ),
    );
    return CustomerProfile.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<void> resetGuestSession() async {
    _accessToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('storefront_cart_session_id');
    _cartItems.clear();
    _mockWishlist.clear();
  }

  Future<WishlistSummary> syncWishlist(String customerId) async {
    final response = await _dio.post(
      '/wishlist/sync',
      data: {
        'guestSessionId': await _cartSessionId(),
        'customerId': customerId,
      },
    );
    return WishlistSummary.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  // Fallback In-Memory Catalog
  final List<ProductSummary> _mockProducts = [
    ProductSummary(
      id: 'prd-1',
      name: 'Samsung 55" Crystal UHD 4K Smart TV',
      code: 'SAM-TV-55',
      description: 'Dynamic Crystal Color dengan HDR10+ dan AirSlim Design.',
      brandName: 'Samsung',
      categoryName: 'Smart TV & Audio',
      minPrice: 6899000,
      maxPrice: 7299000,
      primaryImageUrl:
          'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'IN_STOCK',
      leadTimeDays: 1,
      inStockCount: 14,
    ),
    ProductSummary(
      id: 'prd-2',
      name: 'Sofa Modular L-Shape Scandinavia Velvet',
      code: 'FURN-SOFA-01',
      description:
          'Busa densitas tinggi dengan cover beludru premium anti-noda.',
      brandName: 'SMS Living',
      categoryName: 'Furniture & Living',
      minPrice: 4250000,
      maxPrice: 4850000,
      primaryImageUrl:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
      leadTimeDays: 4,
      inStockCount: 0,
    ),
    ProductSummary(
      id: 'prd-3',
      name: 'LG Kulkas 2 Pintu Inverter Linear 395L',
      code: 'LG-REF-395L',
      description:
          'DoorCooling+ menjaga kesegaran bahan makanan lebih tahan lama.',
      brandName: 'LG',
      categoryName: 'Elektronik Rumah',
      minPrice: 5499000,
      maxPrice: 5799000,
      primaryImageUrl:
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'IN_STOCK',
      leadTimeDays: 1,
      inStockCount: 8,
    ),
    ProductSummary(
      id: 'prd-4',
      name: 'Meja Kerja Minimalis Oak Wood Ergonomis',
      code: 'FURN-DESK-02',
      description: 'Kayu solid oak dengan rangka baja powder-coated kokoh.',
      brandName: 'SMS Living',
      categoryName: 'Furniture & Living',
      minPrice: 1850000,
      maxPrice: 2100000,
      primaryImageUrl:
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'IN_STOCK',
      leadTimeDays: 1,
      inStockCount: 19,
    ),
  ];

  final List<PaymentMethod> _mockPaymentMethods = [
    PaymentMethod(
      id: 'pm-1',
      code: 'QRIS',
      name: 'QRIS Standar Nasional',
      category: 'DIGITAL',
      description: 'Scan cepat semua e-wallet & mobile banking',
      icon: 'qr_code',
      enabled: true,
      requiresApproval: false,
    ),
    PaymentMethod(
      id: 'pm-2',
      code: 'BANK_TRANSFER_VA',
      name: 'Virtual Account Bank',
      category: 'DIGITAL',
      description: 'BCA, Mandiri, BRI, BNI verifikasi otomatis',
      icon: 'account_balance',
      enabled: true,
      requiresApproval: false,
    ),
    PaymentMethod(
      id: 'pm-3',
      code: 'COD_DRIVER',
      name: 'Cash on Delivery (Kurir Toko)',
      category: 'CASH',
      description: 'Bayar tunai kepada driver toko kami saat barang tiba',
      icon: 'local_shipping',
      enabled: true,
      requiresApproval: false,
    ),
    PaymentMethod(
      id: 'pm-4',
      code: 'CASH_STORE',
      name: 'Bayar di Kasir Toko Showroom',
      category: 'CASH',
      description: 'Bayar langsung saat mengambil pesanan di cabang',
      icon: 'storefront',
      enabled: true,
      requiresApproval: false,
    ),
    PaymentMethod(
      id: 'pm-5',
      code: 'IN_HOUSE_CREDIT',
      name: 'Cicilan In-House Toko',
      category: 'CREDIT',
      description: 'Skema kredit internal bersahabat (perlu survei)',
      icon: 'description',
      enabled: true,
      requiresApproval: true,
    ),
    PaymentMethod(
      id: 'pm-6',
      code: 'THIRD_PARTY_FINANCING',
      name: 'Kredivo / Akulaku Financing',
      category: 'FINANCING',
      description: 'Cicilan instan hingga 12 bulan',
      icon: 'verified_user',
      enabled: true,
      requiresApproval: false,
    ),
  ];

  final List<PickupBranch> _mockBranches = [
    PickupBranch(
      id: 'br-1',
      code: 'STR-JKT-01',
      name: 'SMS Mart Showroom Jakarta Pusat',
      address: 'Jl. Jenderal Sudirman No. 42',
    ),
    PickupBranch(
      id: 'br-2',
      code: 'STR-SBY-02',
      name: 'SMS Mart Superstore Surabaya',
      address: 'Jl. Manyar Kertoarjo No. 88',
    ),
  ];

  // In-memory cart
  final List<CartItem> _cartItems = [];

  // In-memory orders
  final List<OrderDetail> _mockOrders = [];

  Future<String> _cartSessionId() async {
    final preferences = await SharedPreferences.getInstance();
    var sessionId = preferences.getString('storefront_cart_session_id');
    if (sessionId == null || sessionId.isEmpty) {
      final random = Random.secure();
      sessionId =
          'mobile-${DateTime.now().millisecondsSinceEpoch}-${random.nextInt(1 << 32)}';
      if (!await preferences.setString('storefront_cart_session_id', sessionId)) {
        throw StateError('Unable to persist guest session');
      }
    }
    return sessionId;
  }

  Future<Options> _cartOptions() async =>
      Options(headers: {'X-Session-ID': await _cartSessionId()});

  // In-memory notifications (FCM/APNs Milestones)
  final List<NotificationItem> _mockNotifications = [
    NotificationItem(
      id: 'notif-1',
      orderNumber: 'SO-APP-888999',
      milestoneType: 'DEPOSIT_CONFIRMED',
      title: 'Pembayaran Terkonfirmasi! 🎉',
      body:
          'Uang muka pesanan #SO-APP-888999 telah kami terima. Pengadaan dan persiapan gudang telah diotorisasi.',
      status: 'SENT',
      isRead: false,
      sentAt: DateTime.now().subtract(const Duration(minutes: 15)),
    ),
    NotificationItem(
      id: 'notif-2',
      orderNumber: 'SO-APP-888999',
      milestoneType: 'PO_PLACED',
      title: 'Pengadaan Dimulai (PO Pemasok) 📦',
      body:
          'Surat Pemesanan (PO) untuk barang indent pesanan #SO-APP-888999 telah diterbitkan ke distributor resmi.',
      status: 'SENT',
      isRead: false,
      sentAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    NotificationItem(
      id: 'notif-3',
      orderNumber: 'SO-APP-777123',
      milestoneType: 'DRIVER_EN_ROUTE',
      title: 'Armada Toko Sedang Menuju Lokasi 🚚',
      body:
          'Driver SMS Mart sedang dalam perjalanan mengantarkan barang pesanan #SO-APP-777123 ke alamat Anda.',
      status: 'SENT',
      isRead: true,
      sentAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    NotificationItem(
      id: 'notif-4',
      orderNumber: 'SO-APP-666321',
      milestoneType: 'STORE_PICKUP_READY',
      title: 'Pesanan Siap Diambil di Cabang 🏬',
      payloadData: '{"pickupStoreName":"SMS Mart Showroom Jakarta Pusat"}',
      body:
          'Pesanan #SO-APP-666321 sudah disiapkan dan siap Anda ambil di SMS Mart Showroom Jakarta Pusat.',
      status: 'SENT',
      isRead: true,
      sentAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  Future<List<ProductSummary>> getProducts({
    String? query,
    String? availability,
  }) async {
    try {
      final res = await _dio.get(
        '/products',
        queryParameters: {
          if (query != null && query.isNotEmpty) 'query': query,
          if (availability != null && availability != 'ALL')
            'availability': availability,
        },
      );
      final list = (res.data as List<dynamic>)
          .map((e) => ProductSummary.fromJson(e))
          .toList();
      if (list.isNotEmpty) return list;
    } catch (_) {}

    var filtered = _mockProducts;
    if (query != null && query.isNotEmpty) {
      filtered = filtered
          .where((p) => p.name.toLowerCase().contains(query.toLowerCase()))
          .toList();
    }
    if (availability != null && availability != 'ALL') {
      filtered = filtered
          .where((p) => p.commercialAvailability == availability)
          .toList();
    }
    return filtered;
  }

  Future<Cart> getCart() async {
    try {
      final response = await _dio.get('/cart', options: await _cartOptions());
      return Cart.fromJson(Map<String, dynamic>.from(response.data as Map));
    } catch (_) {}
    final subtotal = _cartItems.fold<double>(0.0, (sum, i) => sum + i.subtotal);
    final tax = (subtotal * 0.11).roundToDouble();
    return Cart(
      cartId: 'mobile-cart',
      items: List.unmodifiable(_cartItems),
      totalItemCount: _cartItems.fold<int>(0, (sum, i) => sum + i.quantity),
      subtotalAmount: subtotal,
      estimatedTax: tax,
      totalAmount: subtotal + tax,
    );
  }

  Future<Cart> addToCart(
    ProductSummary product, {
    int quantity = 1,
    String? variantId,
  }) async {
    final resolvedVariantId = variantId ?? product.primaryVariantId;
    if (resolvedVariantId != null && resolvedVariantId.isNotEmpty) {
      try {
        final response = await _dio.post(
          '/cart/items',
          data: {'variantId': resolvedVariantId, 'quantity': quantity},
          options: await _cartOptions(),
        );
        return Cart.fromJson(Map<String, dynamic>.from(response.data as Map));
      } on DioException catch (error) {
        if (error.response != null) rethrow;
      }
    }
    final existingIdx = _cartItems.indexWhere((i) => i.variantId == product.id);
    if (existingIdx != -1) {
      _cartItems[existingIdx].quantity += quantity;
      _cartItems[existingIdx].subtotal =
          _cartItems[existingIdx].quantity * _cartItems[existingIdx].unitPrice;
    } else {
      _cartItems.add(
        CartItem(
          itemId: 'item-${DateTime.now().millisecondsSinceEpoch}',
          variantId: product.id,
          productName: product.name,
          variantName: 'Pilihan Standar Resmi',
          sku: product.code,
          unitPrice: product.minPrice,
          quantity: quantity,
          subtotal: product.minPrice * quantity,
          imageUrl: product.primaryImageUrl,
          commercialAvailability: product.commercialAvailability,
        ),
      );
    }
    return getCart();
  }

  Future<Cart> updateQuantity(String itemId, int quantity) async {
    try {
      final response = await _dio.put(
        '/cart/items/$itemId',
        queryParameters: {'quantity': quantity},
        options: await _cartOptions(),
      );
      return Cart.fromJson(Map<String, dynamic>.from(response.data as Map));
    } on DioException catch (error) {
      if (error.response != null) rethrow;
    }
    if (quantity <= 0) {
      _cartItems.removeWhere((i) => i.itemId == itemId);
    } else {
      final item = _cartItems.firstWhere((i) => i.itemId == itemId);
      item.quantity = quantity;
      item.subtotal = item.quantity * item.unitPrice;
    }
    return getCart();
  }

  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await _dio.get('/checkout/payment-methods');
      return (response.data as List<dynamic>)
          .map(
            (item) =>
                PaymentMethod.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .where((method) => method.enabled)
          .toList();
    } catch (_) {}
    return _mockPaymentMethods;
  }

  Future<List<PickupBranch>> getPickupBranches() async {
    try {
      final response = await _dio.get('/checkout/pickup-branches');
      return (response.data as List<dynamic>)
          .map(
            (item) =>
                PickupBranch.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .where((branch) => branch.active)
          .toList();
    } catch (_) {}
    return _mockBranches;
  }

  Future<OrderDetail> processCheckout({
    required String customerName,
    String? customerEmail,
    required String customerPhone,
    required String fulfillmentMethod,
    required String fulfillmentPreference,
    required String paymentMethod,
    String? address,
    String? branchId,
  }) async {
    final cart = await getCart();
    try {
      final response = await _dio.post(
        '/checkout',
        data: {
          'customerName': customerName,
          'customerEmail':
              customerEmail ??
              '${customerPhone.replaceAll(RegExp(r'[^0-9]'), '')}@mobile.smsmart.local',
          'customerPhone': customerPhone,
          'deliveryAddress': fulfillmentMethod == 'DELIVERY'
              ? {
                  'recipientName': customerName,
                  'phone': customerPhone,
                  'streetAddress': address ?? '',
                  'city': '',
                  'province': '',
                  'postalCode': '',
                }
              : null,
          'fulfillmentPreference': fulfillmentPreference,
          'fulfillmentMethod': fulfillmentMethod,
          'pickupStoreId': branchId,
          'paymentMethod': paymentMethod,
          'orderSource': 'ONLINE_APP',
          'items': cart.items
              .map(
                (item) => {
                  'variantId': item.variantId,
                  'quantity': item.quantity,
                },
              )
              .toList(),
        },
      );
      final orderData = Map<String, dynamic>.from(response.data as Map)
        ..['customerName'] = customerName
        ..['customerPhone'] = customerPhone;
      final order = OrderDetail.fromJson(orderData);
      _mockOrders.insert(0, order);
      try {
        await _dio.delete('/cart', options: await _cartOptions());
      } catch (_) {}
      _cartItems.clear();
      return order;
    } on DioException catch (error) {
      if (error.response != null) rethrow;
    }

    final hasIndent = cart.items.any((i) => !i.isReadyStock);
    final deposit = hasIndent
        ? (cart.totalAmount * 0.3).roundToDouble()
        : cart.totalAmount;

    final orderNum =
        'SO-APP-${DateTime.now().millisecondsSinceEpoch % 1000000}';

    final List<FulfillmentGroupSummary> groups = [];
    if (fulfillmentPreference == 'PARTIAL' && hasIndent) {
      // Split into 2 groups
      groups.add(
        FulfillmentGroupSummary(
          groupId: 'grp-1',
          groupNumber: 1,
          fulfillmentMethod: fulfillmentMethod,
          status: 'READY_FOR_PACKING',
          pickupStoreName: 'Central Showroom',
          items: cart.items
              .where((i) => i.isReadyStock)
              .map(
                (i) => FulfillmentItem(
                  productName: i.productName,
                  variantName: i.variantName,
                  sku: i.sku,
                  quantity: i.quantity,
                  isProcurementRequired: false,
                  procurementStatus: 'READY_IN_STOCK',
                ),
              )
              .toList(),
        ),
      );
      groups.add(
        FulfillmentGroupSummary(
          groupId: 'grp-2',
          groupNumber: 2,
          fulfillmentMethod: fulfillmentMethod,
          status: 'AWAITING_PROCUREMENT',
          pickupStoreName: 'Central Showroom',
          items: cart.items
              .where((i) => !i.isReadyStock)
              .map(
                (i) => FulfillmentItem(
                  productName: i.productName,
                  variantName: i.variantName,
                  sku: i.sku,
                  quantity: i.quantity,
                  isProcurementRequired: true,
                  procurementStatus: 'AWAITING_DEPOSIT',
                ),
              )
              .toList(),
        ),
      );
    } else {
      groups.add(
        FulfillmentGroupSummary(
          groupId: 'grp-1',
          groupNumber: 1,
          fulfillmentMethod: fulfillmentMethod,
          status: hasIndent ? 'AWAITING_PROCUREMENT' : 'READY_FOR_PACKING',
          pickupStoreName: 'Central Showroom',
          items: cart.items
              .map(
                (i) => FulfillmentItem(
                  productName: i.productName,
                  variantName: i.variantName,
                  sku: i.sku,
                  quantity: i.quantity,
                  isProcurementRequired: !i.isReadyStock,
                  procurementStatus: !i.isReadyStock
                      ? 'AWAITING_DEPOSIT'
                      : 'READY_IN_STOCK',
                ),
              )
              .toList(),
        ),
      );
    }

    final order = OrderDetail(
      orderId: 'ord-${DateTime.now().millisecondsSinceEpoch}',
      orderNumber: orderNum,
      orderStatus: 'CONFIRMED',
      totalAmount: cart.totalAmount,
      requiredDepositAmount: deposit,
      depositPaid: false,
      paymentMethod: paymentMethod,
      fulfillmentPreference: fulfillmentPreference,
      customerName: customerName,
      customerPhone: customerPhone,
      fulfillmentGroups: groups,
    );

    _mockOrders.insert(0, order);
    _cartItems.clear(); // Clear cart after order placement
    return order;
  }

  Future<OrderDetail> simulatePayment(String orderNumber) async {
    final idx = _mockOrders.indexWhere((o) => o.orderNumber == orderNumber);
    if (idx != -1) {
      final existing = _mockOrders[idx];
      final updatedGroups = existing.fulfillmentGroups.map((g) {
        if (g.status == 'AWAITING_PROCUREMENT') {
          return FulfillmentGroupSummary(
            groupId: g.groupId,
            groupNumber: g.groupNumber,
            fulfillmentMethod: g.fulfillmentMethod,
            status: 'READY_FOR_PACKING',
            pickupStoreName: g.pickupStoreName,
            items: g.items,
          );
        }
        return g;
      }).toList();

      final updated = OrderDetail(
        orderId: existing.orderId,
        orderNumber: existing.orderNumber,
        orderStatus: 'CONFIRMED',
        totalAmount: existing.totalAmount,
        requiredDepositAmount: existing.requiredDepositAmount,
        depositPaid: true,
        paymentMethod: existing.paymentMethod,
        fulfillmentPreference: existing.fulfillmentPreference,
        customerName: existing.customerName,
        customerPhone: existing.customerPhone,
        fulfillmentGroups: updatedGroups,
      );
      _mockOrders[idx] = updated;
      return updated;
    }
    throw StateError('Pesanan tidak ditemukan');
  }

  Future<List<OrderDetail>> getOrders() async {
    return _mockOrders;
  }

  Future<OrderDetail?> findOrder(String orderNumber) async {
    try {
      final response = await _dio.get(
        '/orders/number/${Uri.encodeComponent(orderNumber)}',
      );
      return OrderDetail.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<List<NotificationItem>> getNotifications({
    String? customerId,
    String? orderNumber,
  }) async {
    try {
      final Map<String, dynamic> params = {};
      if (customerId != null) params['customerId'] = customerId;
      if (orderNumber != null) params['orderNumber'] = orderNumber;
      final res = await _dio.get('/notifications', queryParameters: params);
      final list = (res.data as List<dynamic>)
          .map((e) => NotificationItem.fromJson(e))
          .toList();
      if (list.isNotEmpty) return list;
    } catch (_) {}

    var filtered = List<NotificationItem>.from(_mockNotifications);
    if (orderNumber != null && orderNumber.isNotEmpty) {
      filtered = filtered
          .where(
            (n) => n.orderNumber.toUpperCase() == orderNumber.toUpperCase(),
          )
          .toList();
    }
    return filtered;
  }

  Future<void> markNotificationAsRead(String id) async {
    try {
      await _dio.put('/notifications/$id/read');
    } catch (_) {}
    for (final item in _mockNotifications) {
      if (item.id == id) {
        item.isRead = true;
      }
    }
  }

  Future<NotificationItem> triggerMilestoneNotification({
    required String orderNumber,
    required String milestoneType,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final res = await _dio.post(
        '/notifications/trigger-milestone',
        data: {
          'orderNumber': orderNumber,
          'milestoneType': milestoneType,
          'metadata': metadata,
        },
      );
      final item = NotificationItem.fromJson(res.data);
      _mockNotifications.insert(0, item);
      return item;
    } catch (_) {}

    String title = 'Pembaruan Pesanan';
    String body = 'Status pesanan Anda telah diperbarui.';
    switch (milestoneType) {
      case 'DEPOSIT_CONFIRMED':
        title = 'Pembayaran Terkonfirmasi! 🎉';
        body =
            'Pembayaran untuk pesanan #$orderNumber telah kami terima. Penyiapan barang segera diproses.';
        break;
      case 'PO_PLACED':
        title = 'Pengadaan Dimulai (PO Pemasok) 📦';
        body =
            'Surat Pemesanan (PO) untuk barang indent pesanan #$orderNumber telah resmi diterbitkan ke distributor.';
        break;
      case 'DRIVER_EN_ROUTE':
        title = 'Armada Toko Sedang Menuju Lokasi 🚚';
        body =
            'Driver SMS Mart sedang dalam perjalanan mengantarkan pesanan #$orderNumber ke alamat Anda.';
        break;
      case 'STORE_PICKUP_READY':
        final branch =
            metadata != null && metadata.containsKey('pickupStoreName')
            ? metadata['pickupStoreName']
            : 'Showroom Utama';
        title = 'Pesanan Siap Diambil di Cabang 🏬';
        body =
            'Pesanan #$orderNumber sudah siap diambil di $branch. Tunjukkan nomor pesanan kepada petugas.';
        break;
    }

    final newItem = NotificationItem(
      id: 'notif-${DateTime.now().millisecondsSinceEpoch}',
      orderNumber: orderNumber,
      milestoneType: milestoneType,
      title: title,
      body: body,
      payloadData: metadata == null ? null : jsonEncode(metadata),
      status: 'SENT',
      isRead: false,
      sentAt: DateTime.now(),
    );

    _mockNotifications.insert(0, newItem);
    return newItem;
  }

  Future<PickupPass> getPickupPass(String orderNumber) async {
    try {
      final res = await _dio.get('/pickup/pass/$orderNumber');
      return PickupPass.fromJson(res.data);
    } catch (_) {
      final order = _mockOrders.firstWhere(
        (o) => o.orderNumber == orderNumber || o.orderId == orderNumber,
        orElse: () => _mockOrders.first,
      );

      return PickupPass(
        orderNumber: order.orderNumber,
        fulfillmentGroupId: 'fg-mock-1',
        groupNumber: 1,
        pickupStoreCode: 'SHOWROOM-CENTRAL',
        pickupStoreName: 'SMS Mart Flagship Showroom Central',
        pickupStoreAddress: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
        operatingHours: 'Senin - Minggu: 09:00 - 21:00 WIB',
        contactPhone: '+62 21 555-0199',
        pickupPassCode: 'PKP-8921-9988',
        qrPayload: 'SMS-PICKUP:${order.orderNumber}:1:PKP-8921-9988',
        stagingStatus: order.depositPaid
            ? 'READY_FOR_PICKUP'
            : 'AWAITING_STAGING',
        stagingRackLocation: 'Rak Display A-03 (Showroom Utama)',
        stagedAt: DateTime.now().subtract(const Duration(minutes: 30)),
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        requiredDepositAmount: order.requiredDepositAmount,
        depositPaid: order.depositPaid,
        remainingBalance: order.depositPaid
            ? (order.totalAmount - order.requiredDepositAmount).clamp(
                0,
                double.infinity,
              )
            : order.totalAmount,
        fullyPaid:
            order.depositPaid &&
            order.requiredDepositAmount >= order.totalAmount,
        readyForCollection: true,
        items: [
          PickupPassItem(
            productName: 'Samsung 55" Crystal UHD 4K Smart TV',
            variantName: 'Black 4K',
            sku: 'SAM-TV-55',
            quantity: 1,
            procurementRequired: false,
          ),
        ],
      );
    }
  }

  Future<PickupPass> stagePickup({
    required String orderNumber,
    required String rackLocation,
    String? staffName,
  }) async {
    try {
      final res = await _dio.post(
        '/pickup/stage',
        data: {
          'orderNumber': orderNumber,
          'stagingRackLocation': rackLocation,
          'stagedByStaffName': staffName ?? 'Staff Showroom',
        },
      );
      return PickupPass.fromJson(res.data);
    } catch (_) {
      final pass = await getPickupPass(orderNumber);
      return pass.copyWith(
        stagingStatus: 'READY_FOR_PICKUP',
        stagingRackLocation: rackLocation,
        stagedAt: DateTime.now(),
        readyForCollection: true,
      );
    }
  }

  Future<Map<String, dynamic>> verifyHandover({
    required String pickupPassCode,
    required String staffName,
    String? recipientName,
  }) async {
    try {
      final res = await _dio.post(
        '/pickup/verify-handover',
        data: {
          'pickupPassCode': pickupPassCode,
          'staffEmployeeName': staffName,
          'recipientIdentityName': recipientName,
          'settleRemainingBalance': true,
        },
      );
      return res.data;
    } catch (_) {
      return {
        'success': true,
        'pickupPassCode': pickupPassCode,
        'staffEmployeeName': staffName,
        'recipientIdentityName': recipientName ?? 'Pelanggan',
        'handedOverAt': DateTime.now().toIso8601String(),
        'message': 'Verifikasi serah terima pesanan berhasil.',
      };
    }
  }

  // ================= Persistent Wishlist & Saved Items (P.16) =================
  final List<WishlistItem> _mockWishlist = [
    WishlistItem(
      id: 'wl-tv-55',
      productId: 'prd-1',
      variantId: 'var-tv-55',
      productName: 'Samsung 55" Crystal UHD 4K Smart TV',
      variantName: 'Black Edition 4K',
      sku: 'SAM-TV-55',
      categoryName: 'Smart TV & Audio',
      brandName: 'Samsung',
      primaryImageUrl:
          'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'IN_STOCK',
      leadTimeDays: 1,
      inStockCount: 14,
      originalAddedPrice: 7499000.0,
      currentPrice: 6899000.0,
      hasPriceDrop: true,
      priceDropAmount: 600000.0,
      priceDropPercentage: 8.0,
      notes: 'Rencana pasang di ruang keluarga saat liburan',
      addedAt: DateTime.now().subtract(const Duration(days: 4)),
    ),
    WishlistItem(
      id: 'wl-sofa-velvet',
      productId: 'prd-2',
      variantId: 'var-sofa-l',
      productName: 'Sofa Modular L-Shape Scandinavia Velvet',
      variantName: 'Velvet Midnight Blue',
      sku: 'FURN-SOFA-01',
      categoryName: 'Furniture & Living',
      brandName: 'SMS Living',
      primaryImageUrl:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: 'AVAILABLE_PROCUREMENT_REQUIRED',
      leadTimeDays: 4,
      inStockCount: 0,
      originalAddedPrice: 4250000.0,
      currentPrice: 4250000.0,
      hasPriceDrop: false,
      priceDropAmount: 0.0,
      priceDropPercentage: 0.0,
      notes: 'Kombinasi warna cocok dengan cat tembok',
      addedAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  Future<WishlistSummary> getWishlist() async {
    try {
      final res = await _dio.get('/wishlist');
      return WishlistSummary.fromJson(res.data);
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      final dropCount = _mockWishlist.where((i) => i.hasPriceDrop).length;
      final totalSavings = _mockWishlist.fold<double>(
        0.0,
        (acc, i) => acc + (i.hasPriceDrop ? i.priceDropAmount : 0.0),
      );
      return WishlistSummary(
        items: List.unmodifiable(_mockWishlist),
        totalItems: _mockWishlist.length,
        priceDropCount: dropCount,
        totalPotentialSavings: totalSavings,
      );
    }
  }

  Future<WishlistItem> addToWishlist(
    ProductSummary product, {
    String? notes,
  }) async {
    try {
      final res = await _dio.post(
        '/wishlist/items',
        data: {
          'productId': product.id,
          'currentPrice': product.minPrice,
          'notes': notes,
        },
      );
      return WishlistItem.fromJson(res.data);
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      final existingIdx = _mockWishlist.indexWhere(
        (i) => i.productId == product.id,
      );
      if (existingIdx != -1) {
        return _mockWishlist[existingIdx];
      }
      final newItem = WishlistItem(
        id: 'wl-${DateTime.now().millisecondsSinceEpoch}',
        productId: product.id,
        productName: product.name,
        variantName: 'Pilihan Standar Resmi',
        sku: product.code,
        categoryName: product.categoryName,
        brandName: product.brandName,
        primaryImageUrl: product.primaryImageUrl,
        commercialAvailability: product.commercialAvailability,
        leadTimeDays: product.leadTimeDays,
        inStockCount: product.inStockCount,
        originalAddedPrice: product.minPrice,
        currentPrice: product.minPrice,
        hasPriceDrop: false,
        priceDropAmount: 0.0,
        priceDropPercentage: 0.0,
        notes: notes ?? 'Item tersimpan impian',
        addedAt: DateTime.now(),
      );
      _mockWishlist.insert(0, newItem);
      return newItem;
    }
  }

  Future<void> removeFromWishlist(String itemId) async {
    try {
      await _dio.delete('/wishlist/items/$itemId');
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      _mockWishlist.removeWhere((i) => i.id == itemId);
    }
  }

  Future<void> removeFromWishlistByProduct(String productId) async {
    try {
      await _dio.delete('/wishlist/products/$productId');
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      _mockWishlist.removeWhere((i) => i.productId == productId);
    }
  }

  Future<bool> isWishlisted(String productId) async {
    try {
      final res = await _dio.get('/wishlist/check/$productId');
      return res.data['wishlisted'] == true;
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      return _mockWishlist.any((i) => i.productId == productId);
    }
  }

  Future<Cart> moveToCartFromWishlist(String itemId) async {
    try {
      final res = await _dio.post('/wishlist/items/$itemId/move-to-cart');
      return Cart.fromJson(res.data);
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      final item = _mockWishlist.firstWhere((i) => i.id == itemId);
      final prod = _mockProducts.firstWhere(
        (p) => p.id == item.productId,
        orElse: () => ProductSummary(
          id: item.productId,
          name: item.productName,
          code: item.sku,
          description: '',
          brandName: item.brandName,
          categoryName: item.categoryName,
          minPrice: item.currentPrice,
          maxPrice: item.currentPrice,
          primaryImageUrl: item.primaryImageUrl,
          commercialAvailability: item.commercialAvailability,
          leadTimeDays: item.leadTimeDays,
          inStockCount: item.inStockCount,
        ),
      );
      await addToCart(prod);
      _mockWishlist.removeWhere((i) => i.id == itemId);
      return getCart();
    }
  }

  Future<WishlistItem> simulatePriceDrop(
    String itemId, {
    double? newPrice,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (newPrice != null) {
        data['newPrice'] = newPrice;
      }
      final res = await _dio.post(
        '/wishlist/items/$itemId/simulate-price-drop',
        data: data,
      );
      return WishlistItem.fromJson(res.data);
    } on DioException catch (error) {
      if (_accessToken != null || error.response != null) rethrow;
      final idx = _mockWishlist.indexWhere((i) => i.id == itemId);
      if (idx == -1) throw StateError('Item not found');
      final item = _mockWishlist[idx];
      final targetPrice =
          newPrice ?? (item.originalAddedPrice * 0.85).roundToDouble();
      final dropAmount = (item.originalAddedPrice - targetPrice).clamp(
        0.0,
        double.infinity,
      );
      final dropPercentage = double.parse(
        ((dropAmount / item.originalAddedPrice) * 100).toStringAsFixed(1),
      );

      final updated = item.copyWith(
        currentPrice: targetPrice,
        hasPriceDrop: targetPrice < item.originalAddedPrice,
        priceDropAmount: dropAmount,
        priceDropPercentage: dropPercentage,
      );
      _mockWishlist[idx] = updated;
      return updated;
    }
  }
}
