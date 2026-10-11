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
      final profile = await TokenStorage.getProfile();
      final token = await TokenStorage.getToken();

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
      final mockProfile = UserProfile(
        id: 'emp-worker-01',
        fullName: email.split('@').first.replaceAll('.', ' ').toUpperCase(),
        employeeNumber: 'EMP-7701',
        email: email,
        storeId: 'store-01',
        storeName: 'Pusat Jaya Store',
        roles: _resolveRolesFromEmail(email),
        permissions: ['ATTENDANCE_RECORD', 'DELIVERY_EXECUTE', 'SURVEY_DECIDE', 'FINANCE_COLLECT'],
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
    // Default multi-operational worker
    return ['SURVEYOR', 'DRIVER', 'COLLECTOR'];
  }

  Future<void> logout() async {
    await TokenStorage.clear();
    state = const AuthState();
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
