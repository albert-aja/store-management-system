import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../core/app_text.dart';
import '../core/wishlist_share_links.dart';
import '../core/localized_errors.dart';
import '../providers/wishlist_share_provider.dart';

String wishlistShareError(BuildContext context, Object error) {
  if (error is MissingStorefrontUrl) {
    return AppText.shareConfigurationMissing(context);
  }
  if (error is MissingReservationKey) {
    return AppText.missingCancellationKey(context);
  }
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map &&
        const {
          'Cannot share an empty wishlist',
          'Wishlist share not found',
          'This item has already been reserved',
          'Sign in or provide a guest session to manage wishlist shares',
        }.contains(data['message'])) {
      return localError(context, error);
    }
    switch (error.response?.statusCode) {
      case 410:
        return AppText.snapshotExpired(context);
      case 404:
        return AppText.snapshotUnavailable(context);
      case 409:
        return AppText.shareConflict(context);
    }
  }
  return AppText.shareOperationFailed(context);
}

void showWishlistShareError(BuildContext context, Object error) {
  ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text(wishlistShareError(context, error))));
}

Future<void> copyWishlistText(
  BuildContext context,
  String text, {
  bool privateKey = false,
}) async {
  try {
    await Clipboard.setData(ClipboardData(text: text));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            privateKey
                ? AppText.privateKeyCopied(context)
                : AppText.copiedShareLink(context),
          ),
        ),
      );
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(AppText.clipboardFailed(context))));
    }
  }
}

class WishlistShareLinkActions extends StatelessWidget {
  final Uri link;
  const WishlistShareLinkActions({super.key, required this.link});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SelectableText(link.toString()),
      Wrap(
        spacing: 8,
        children: [
          TextButton.icon(
            icon: const Icon(Icons.copy),
            label: Text(AppText.copyShareLink(context)),
            onPressed: () => copyWishlistText(context, link.toString()),
          ),
          Builder(
            builder: (buttonContext) => TextButton.icon(
              icon: const Icon(Icons.share),
              label: Text(AppText.shareLink(context)),
              onPressed: () async {
                try {
                  final box = buttonContext.findRenderObject() as RenderBox;
                  final result = await SharePlus.instance.share(
                    ShareParams(
                      text: link.toString(),
                      sharePositionOrigin:
                          box.localToGlobal(Offset.zero) & box.size,
                    ),
                  );
                  if (result.status == ShareResultStatus.unavailable &&
                      context.mounted) {
                    throw StateError('Share unavailable');
                  }
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(AppText.shareSheetFailed(context)),
                      ),
                    );
                  }
                }
              },
            ),
          ),
        ],
      ),
    ],
  );
}

Future<void> showPrivateCancellationKey(
  BuildContext context,
  String key, {
  bool storageFailed = false,
}) => showDialog<void>(
  context: context,
  builder: (context) => AlertDialog(
    title: Text(AppText.recoveryKey(context)),
    content: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (storageFailed) Text(AppText.keyStorageFailed(context)),
          SelectableText(key),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => copyWishlistText(context, key, privateKey: true),
        child: Text(AppText.copyPrivateKey(context)),
      ),
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: Text(MaterialLocalizations.of(context).closeButtonLabel),
      ),
    ],
  ),
);
