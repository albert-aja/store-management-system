class UserProfile {
  final String id;
  final String fullName;
  final String employeeNumber;
  final String? email;
  final String? storeId;
  final String? storeName;
  final List<String> roles;
  final List<String> permissions;

  const UserProfile({
    required this.id,
    required this.fullName,
    required this.employeeNumber,
    this.email,
    this.storeId,
    this.storeName,
    required this.roles,
    required this.permissions,
  });

  bool hasRole(String role) => roles.contains(role);
  bool hasPermission(String perm) => permissions.contains(perm);

  bool get isSurveyor => hasRole('SURVEYOR');
  bool get isDriver => hasRole('DRIVER');
  bool get isCollector => hasRole('COLLECTOR');
  bool get isSalesperson => hasRole('SALESPERSON');
  bool get isSPV => hasRole('SPV');
  bool get isManager => hasRole('MANAGER') || hasRole('OWNER');
  bool get isHelper => hasRole('HELPER');

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      employeeNumber: json['employeeNumber'] as String? ?? '',
      email: json['email'] as String?,
      storeId: json['storeId'] as String?,
      storeName: json['storeName'] as String?,
      roles:
          (json['roles'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      permissions:
          (json['permissions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'employeeNumber': employeeNumber,
      'email': email,
      'storeId': storeId,
      'storeName': storeName,
      'roles': roles,
      'permissions': permissions,
    };
  }
}
