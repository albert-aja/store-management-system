class PaymentMethod {
  final String id;
  final String code;
  final String name;
  final String category;
  final String description;
  final String icon;
  final bool enabled;
  final bool requiresApproval;

  PaymentMethod({
    required this.id,
    required this.code,
    required this.name,
    required this.category,
    required this.description,
    required this.icon,
    required this.enabled,
    required this.requiresApproval,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'DIGITAL',
      description: json['description'] ?? '',
      icon: json['icon'] ?? 'credit_card',
      enabled: json['enabled'] ?? true,
      requiresApproval: json['requiresApproval'] ?? false,
    );
  }
}

class PickupBranch {
  final String id;
  final String code;
  final String name;
  final String address;
  final bool active;

  PickupBranch({
    required this.id,
    required this.code,
    required this.name,
    required this.address,
    this.active = true,
  });

  factory PickupBranch.fromJson(Map<String, dynamic> json) {
    return PickupBranch(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      active: json['active'] ?? true,
    );
  }
}
