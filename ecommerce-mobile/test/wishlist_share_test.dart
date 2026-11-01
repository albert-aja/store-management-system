import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/core/api_client.dart';
import 'package:ecommerce_mobile/core/wishlist_deep_links.dart';
import 'package:ecommerce_mobile/core/wishlist_share_links.dart';
import 'package:ecommerce_mobile/models/wishlist_share_model.dart';
import 'package:ecommerce_mobile/providers/wishlist_share_provider.dart';

final token = List.filled(43, 'a').join();
final key = List.filled(43, 'b').join();

class FakeLinkSource implements WishlistLinkSource {
  final StreamController<Uri> controller = StreamController<Uri>.broadcast();
  Uri? initial;

  @override
  Future<Uri?> initialLink() async => initial;

  @override
  Stream<Uri> get links => controller.stream;
}

class MemoryReservationKeys implements ReservationKeyStore {
  final values = <String, String>{};
  bool failWrites = false;

  String _id(String token, String item) => '$token:$item';

  @override
  Future<String?> read(String token, String itemId) async => values[_id(token, itemId)];

  @override
  Future<void> write(String token, String itemId, String key) async {
    if (failWrites) throw StateError('Storage unavailable');
    values[_id(token, itemId)] = key;
  }

  @override
  Future<void> remove(String token, String itemId) async {
    values.remove(_id(token, itemId));
  }
}

void main() {
  group('P.27 shared wishlist links', () {
    const config = WishlistShareLinks('https://shop.example.test');
    final link = config.create(token);

    test('generates HTTPS link and rejects altered origins, paths, query and token', () {
      expect(link.toString(), 'https://shop.example.test/wishlist/share/$token');
      expect(config.parse(link), token);
      expect(config.parse(Uri.parse('https://evil.example.test${link.path}')), isNull);
      expect(config.parse(Uri.parse('https://shop.example.test/wishlist/share/$token/extra')), isNull);
      expect(config.parse(Uri.parse('${link.toString()}?redirect=evil')), isNull);
      expect(config.parse(Uri.parse('https://shop.example.test/wishlist/share/%2e%2e')), isNull);
      expect(() => config.create('short'), throwsFormatException);
      expect(
        () => const WishlistShareLinks().create(token),
        throwsA(isA<MissingStorefrontUrl>()),
      );
    });

    test('accepts only configured HTTPS public links; never forwards auth callbacks', () async {
      final source = FakeLinkSource()
        ..initial = link;
      final opened = <String>[];
      final receiver = WishlistDeepLinks(config, opened.add);
      await receiver.start(source);
      source.controller.add(Uri.parse('com.sms.mart://login-callback?code=secret'));
      source.controller.add(Uri.parse('https://evil.example.test/wishlist/share/$token'));
      source.controller.add(link);
      await Future<void>.delayed(Duration.zero);
      expect(opened, [token, token]);
      receiver.dispose();
      await source.controller.close();
    });

    test('parses immutable public snapshots and enforces whole-item quantity', () {
      final snapshot = SharedWishlist.fromJson({
        'createdAt': '2026-11-01T00:00:00Z',
        'expiresAt': '2026-12-01T00:00:00Z',
        'items': [{
          'id': 'item-1',
          'productId': 'product-1',
          'variantId': null,
          'productName': 'Gift sofa',
          'variantName': 'Blue',
          'primaryImageUrl': null,
          'quantity': 1,
          'reserved': false,
          'notes': 'must not be exposed in model',
          'price': 1000000,
          'customerEmail': 'private@example.test',
        }],
      });
      expect(snapshot.items.single.productName, 'Gift sofa');
      expect(snapshot.items.single.reserved, isFalse);
      expect(() => SharedWishlist.fromJson({
        'createdAt': '2026-11-01T00:00:00Z',
        'expiresAt': '2026-12-01T00:00:00Z',
        'items': [{
          'id': 'item-1', 'productId': 'product-1', 'productName': 'Gift',
          'quantity': 2, 'reserved': false,
        }],
      }), throwsFormatException);
    });

    test('claims preserve private recovery key and storage failures return the key', () async {
      final public = Dio(BaseOptions(baseUrl: 'https://shop.example.test/api/v1/storefront'));
      final publicRequests = <RequestOptions>[];
      public.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
        publicRequests.add(options);
        handler.resolve(Response(
          requestOptions: options,
          statusCode: 200,
          data: options.method == 'POST'
              ? {'cancellationKey': key}
              : {'createdAt': '2026-11-01T00:00:00Z', 'expiresAt': '2026-12-01T00:00:00Z', 'items': []},
        ));
      }));
      final authenticated = Dio(BaseOptions(baseUrl: 'https://shop.example.test/api/v1/storefront'));
      final api = ApiClient.withTransport(authenticated, public);
      final store = MemoryReservationKeys();
      final service = WishlistReservationService(api, store);

      await service.reserve(token, 'item-1');
      expect(await service.key(token, 'item-1'), key);
      expect(publicRequests.single.path, contains('/wishlist/share/$token/items/item-1/reservation'));
      expect(publicRequests.single.headers, isNot(contains('Authorization')));
      expect(publicRequests.single.headers, isNot(contains('X-Session-ID')));
      await service.cancel(token, 'item-1');
      expect(publicRequests.last.method, 'DELETE');
      expect(publicRequests.last.data, {'cancellationKey': key});
      expect(await service.key(token, 'item-1'), isNull);

      store.failWrites = true;
      await expectLater(
        service.reserve(token, 'item-2'),
        throwsA(
          isA<ReservationKeyStorageFailure>().having(
            (failure) => failure.cancellationKey,
            'recovery key',
            key,
          ),
        ),
      );
      expect(service.keyNotSaved(token, 'item-2'), isTrue);
      expect(await service.key(token, 'item-2'), key);
    });
  });
}
