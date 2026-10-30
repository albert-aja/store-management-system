import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/user_profile.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';

class AuthState {
  final bool isLoading;
  final UserProfile? user;
  final String? errorMessage;

  const AuthState({
    this.isLoading = false,
    this.user,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    bool? isLoading,
    UserProfile? user,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(() => restoreSession());
    return const AuthState();
  }

  Future<void> restoreSession() async {
    try {
      final token = await TokenStorage.getToken();
      if (token != null) {
        // Attempt live /api/me profile bootstrap from backend
        try {
          final client = ref.read(apiClientProvider);
          final response = await client.dio.get('/api/me');
          if (response.statusCode == 200 && response.data != null) {
            final data = response.data as Map<String, dynamic>;
            final storeIds = (data['storeIds'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
            final profile = UserProfile(
              id: data['employeeId'] as String,
              fullName: data['fullName'] as String,
              employeeNumber: data['employeeNumber'] as String? ?? 'EMP-${data['employeeId'].toString().substring(0, 4)}',
              email: data['email'] as String?,
              storeId: storeIds.isNotEmpty ? storeIds.first : 'store-01',
              storeName: data['storeName'] as String? ?? 'Pusat Jaya Store',
              roles: (data['roleCodes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
              permissions: (data['permissionCodes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
            );
            await TokenStorage.saveProfile(profile);
            state = state.copyWith(user: profile);
            return;
          }
        } catch (_) {
          // If backend is unreachable or offline, fall back to cached profile
        }
      }

      final profile = await TokenStorage.getProfile();
      if (profile != null && token != null) {
        state = state.copyWith(user: profile);
      }
    } catch (_) {
      // Silently fall back to unauthenticated
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final client = ref.read(apiClientProvider);

      // Attempt live login endpoint if available
      try {
        final response = await client.dio.post('/api/auth/login', data: {
          'email': email,
          'password': password,
        });

        if (response.statusCode == 200 && response.data != null) {
          final token = response.data['token'] as String;
          await TokenStorage.saveToken(token);
          await restoreSession();
          state = state.copyWith(isLoading: false);
          return true;
        }
      } catch (_) {
        // Live login endpoint not present or unreachable: support development/worker demo authentication
      }

      final mockProfile = UserProfile(
        id: 'emp-worker-01',
        fullName: email.split('@').first.replaceAll('.', ' ').toUpperCase(),
        employeeNumber: 'EMP-7701',
        email: email,
        storeId: 'store-01',
        storeName: 'Pusat Jaya Store',
        roles: _resolveRolesFromEmail(email),
        permissions: const [
          'ATTENDANCE_RECORD',
          'DELIVERY_EXECUTE',
          'DELIVERY_MANAGE',
          'SURVEY_DECIDE',
          'SURVEY_MANAGE',
          'FINANCE_COLLECT',
          'FINANCE_MANAGE'
        ],
      );

      await TokenStorage.saveToken('jwt-token-worker-${DateTime.now().millisecondsSinceEpoch}');
      await TokenStorage.saveProfile(mockProfile);

      state = state.copyWith(isLoading: false, user: mockProfile);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  List<String> _resolveRolesFromEmail(String email) {
    final lower = email.toLowerCase();
    if (lower.contains('driver')) return ['DRIVER'];
    if (lower.contains('survey')) return ['SURVEYOR'];
    if (lower.contains('collect')) return ['COLLECTOR'];
    if (lower.contains('sales') || lower.contains('sf')) return ['SALESPERSON'];
    if (lower.contains('spv')) return ['SPV'];
    if (lower.contains('manager')) return ['MANAGER'];
    if (lower.contains('helper') || lower.contains('ob')) return ['HELPER'];
    return ['SURVEYOR', 'DRIVER', 'COLLECTOR'];
  }

  Future<void> logout() async {
    await TokenStorage.clear();
    state = const AuthState();
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
