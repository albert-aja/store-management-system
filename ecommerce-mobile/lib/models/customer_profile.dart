class CustomerProfile {
  final String customerId;
  final String email;
  final String fullName;
  final String? phone;

  const CustomerProfile({
    required this.customerId,
    required this.email,
    required this.fullName,
    this.phone,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) =>
      CustomerProfile(
        customerId: json['customerId'] as String,
        email: json['email'] as String,
        fullName: json['fullName'] as String,
        phone: json['phone'] as String?,
      );
}
