import '../core/app_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/language_switcher.dart';
import 'auth_screen.dart';
import 'home_screen.dart';
import 'catalog_screen.dart';
import 'cart_screen.dart';
import 'order_tracking_screen.dart';
import 'profile_screen.dart';

class MainNavScreen extends ConsumerStatefulWidget {
  const MainNavScreen({super.key});

  @override
  ConsumerState<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends ConsumerState<MainNavScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (previous, next) {
      final user = next.value;
      if (user != null && user.customerId != previous?.value?.customerId) {
        ref.read(wishlistProvider.notifier).clear();
        ref
            .read(apiClientProvider)
            .syncWishlist(user.customerId)
            .then((wishlist) {
              if (mounted) ref.invalidate(wishlistProvider);
            })
            .catchError((Object error) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(loginErrorMessage(error, context: context)),
                  ),
                );
              }
            });
      }
    });
    final cart = ref.watch(cartProvider);

    return Scaffold(
      body: Column(
        children: [
          const SafeArea(
            bottom: false,
            child: Align(
              alignment: Alignment.centerRight,
              child: LanguageSwitcher(),
            ),
          ),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: [
                HomeScreen(
                  onOpenCatalog: () => setState(() => _currentIndex = 1),
                ),
                const CatalogScreen(),
                CartScreen(
                  onContinueShopping: () => setState(() => _currentIndex = 1),
                ),
                const OrderTrackingScreen(),
                const ProfileScreen(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: AppTheme.cardBorder)),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) =>
              setState(() => _currentIndex = index),
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_outlined),
              label: AppText.home(context),
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view_outlined),
              label: AppText.catalog(context),
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: cart.totalItemCount > 0,
                label: Text(formatArgument(context, cart.totalItemCount)),
                child: Icon(Icons.shopping_cart_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: cart.totalItemCount > 0,
                label: Text(formatArgument(context, cart.totalItemCount)),
                child: Icon(Icons.shopping_cart),
              ),
              label: AppText.cart(context),
            ),
            NavigationDestination(
              icon: Icon(Icons.local_shipping_outlined),
              selectedIcon: Icon(Icons.local_shipping_outlined),
              label: AppText.track(context),
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person_outline),
              label: AppText.account(context),
            ),
          ],
        ),
      ),
    );
  }
}
