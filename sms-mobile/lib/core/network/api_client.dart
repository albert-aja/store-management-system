import 'package:dio/dio.dart';
import '../storage/token_storage.dart';

class ApiClient {
  static const String defaultBaseUrl = 'http://10.0.2.2:8080';

  final Dio _dio;

  ApiClient({String baseUrl = defaultBaseUrl})
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Can handle 401 unauthenticated if needed
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
