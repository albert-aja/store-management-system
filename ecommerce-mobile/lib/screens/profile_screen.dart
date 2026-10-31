import '../core/app_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import 'auth_screen.dart';
import 'wishlist_screen.dart';
import '../widgets/language_switcher.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.value;
    return Scaffold(
      appBar: AppBar(
        actions: const [LanguageSwitcher()],
        title: Text(
          AppText.myAccount(context),
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            if (auth.isLoading) LinearProgressIndicator(),
            if (auth.hasError)
              Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text(
                  loginErrorMessage(auth.error!, context: context),
                  style: TextStyle(color: Colors.red),
                ),
              ),
            // User Card
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppTheme.primarySky.withValues(
                      alpha: 0.15,
                    ),
                    child: Text(
                      user == null
                          ? '?'
                          : user.fullName.substring(0, 1).toUpperCase(),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: AppTheme.primarySky,
                      ),
                    ),
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? AppText.notSignedIn(context),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.darkSlate,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          user?.email ?? AppText.signInWithGoogleOrAn(context),
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        SizedBox(height: 6),
                        if (user != null)
                          Row(
                            children: [
                              Icon(
                                Icons.verified,
                                size: 14,
                                color: AppTheme.primarySky,
                              ),
                              SizedBox(width: 4),
                              Text(
                                AppText.emailVerified(context),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primarySky,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 12),
            if (user == null)
              FilledButton(
                onPressed: auth.isLoading
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => AuthScreen()),
                        );
                      },
                child: Text(AppText.signInRegister(context)),
              )
            else
              OutlinedButton(
                onPressed: () async {
                  try {
                    await ref.read(authProvider.notifier).logout();
                    ref.invalidate(cartProvider);
                    ref.invalidate(wishlistProvider);
                  } catch (error) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            loginErrorMessage(error, context: context),
                          ),
                        ),
                      );
                    }
                  }
                },
                child: Text(AppText.signOut(context)),
              ),

            SizedBox(height: 16),

            // In-house Credit Facility (Money Management context)
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppTheme.cardBorder),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.storeInstallmentFacility(context),
                        style: TextStyle(
                          color: AppTheme.mutedText,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Icon(
                        Icons.credit_card,
                        color: AppTheme.primarySky,
                        size: 18,
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  Text(
                    AppText.availableLimitRp(context),
                    style: TextStyle(
                      color: AppTheme.darkSlate,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    AppText.usedBalanceRpApprovedThroughAn(context),
                    style: TextStyle(color: AppTheme.mutedText, fontSize: 12),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Menu Items
            Material(
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: AppTheme.cardBorder),
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    context,
                    Icons.favorite_outline,
                    AppText.wishlistSavedProducts(context),
                    AppText.viewYourFavoritesAndMonitorPrice(context),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => WishlistScreen()),
                      );
                    },
                  ),
                  Divider(height: 1),
                  _buildMenuItem(
                    context,
                    Icons.location_on_outlined,
                    AppText.deliveryAddressBook(context),
                    AppText.manageHomeAndOfficeAddresses(context),
                  ),
                  Divider(height: 1),
                  _buildMenuItem(
                    context,
                    Icons.receipt_long_outlined,
                    AppText.paymentBillingHistory(context),
                    AppText.paymentHistorySummary(context),
                  ),
                  Divider(height: 1),
                  _buildMenuItem(
                    context,
                    Icons.support_agent_outlined,
                    AppText.helpAndCustomerCare(context),
                    AppText.contactTheSmsMartSupportTeam(context),
                  ),
                  Divider(height: 1),
                  _buildMenuItem(
                    context,
                    Icons.shield_outlined,
                    AppText.securityAndPrivacy(context),
                    AppText.accountAndPrivacyInformation(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle, {
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primarySky),
      title: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 11, color: Colors.grey),
      ),
      trailing: Icon(Icons.chevron_right, size: 18, color: Colors.grey),
      onTap: onTap ?? () {},
    );
  }
}
