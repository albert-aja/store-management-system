import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_text.dart';
import '../providers/catalog_provider.dart';
import '../providers/wishlist_share_provider.dart';
import '../screens/shared_wishlist_screen.dart';
import 'wishlist_share_actions.dart';

class WishlistSharePanel extends ConsumerStatefulWidget {
  const WishlistSharePanel({super.key});

  @override
  ConsumerState<WishlistSharePanel> createState() => _WishlistSharePanelState();
}

class _WishlistSharePanelState extends ConsumerState<WishlistSharePanel> {
  bool _busy = false;
  Uri? _createdLink;

  Future<void> _create() async {
    setState(() => _busy = true);
    try {
      final links = ref.read(wishlistShareLinksProvider);
      // Validate deployment configuration before creating a server snapshot.
      links.origin;
      final share = await ref.read(apiClientProvider).createWishlistShare();
      final token = share.token;
      if (token == null) throw const FormatException('Missing share token');
      final link = links.create(token);
      if (!mounted) return;
      setState(() => _createdLink = link);
      ref.invalidate(wishlistSharesProvider);
    } catch (error) {
      if (mounted) showWishlistShareError(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _revoke(String id) async {
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).revokeWishlistShare(id);
      if (!mounted) return;
      setState(() => _createdLink = null);
      final refreshed = ref.refresh(wishlistSharesProvider.future);
      await refreshed;
    } catch (error) {
      if (mounted) showWishlistShareError(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shares = ref.watch(wishlistSharesProvider);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(AppText.snapshotPrivacy(context)),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _busy ? null : _create,
              icon: const Icon(Icons.share_outlined),
              label: Text(AppText.shareSnapshot(context)),
            ),
            if (_createdLink case final link?) ...[
              WishlistShareLinkActions(link: link),
              TextButton(
                onPressed: () {
                  final token = ref
                      .read(wishlistShareLinksProvider)
                      .parse(link);
                  if (token != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => SharedWishlistScreen(token: token),
                      ),
                    );
                  }
                },
                child: Text(AppText.sharedWishlist(context)),
              ),
            ],
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(AppText.activeSnapshots(context)),
              children: [
                shares.when(
                  loading: () => const LinearProgressIndicator(),
                  error: (error, _) => Column(
                    children: [
                      Text(wishlistShareError(context, error)),
                      TextButton(
                        onPressed: () => ref.invalidate(wishlistSharesProvider),
                        child: Text(AppText.refresh(context)),
                      ),
                    ],
                  ),
                  data: (list) => Column(
                    children: [
                      TextButton(
                        onPressed: () => ref.invalidate(wishlistSharesProvider),
                        child: Text(AppText.refresh(context)),
                      ),
                      for (final share in list)
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            AppText.snapshotExpires(context, share.expiresAt),
                          ),
                          subtitle: share.revokedAt == null
                              ? null
                              : Text(AppText.revokedSnapshot(context)),
                          trailing: share.active
                              ? IconButton(
                                  tooltip: AppText.revokeSnapshot(context),
                                  icon: const Icon(Icons.link_off),
                                  onPressed: _busy
                                      ? null
                                      : () => _revoke(share.id),
                                )
                              : null,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
