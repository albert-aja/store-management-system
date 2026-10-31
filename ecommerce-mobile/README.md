# SMS Mart Mobile

Google and email OTP login setup, runtime flags, callback URLs and release checks:
[Infrastructure setup guide](../docs/infrastructure_setup_guide.md#7-e-commerce-google-login-and-email-otp).

Missing Supabase configuration leaves guest browsing available. To enable login, pass
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` using `--dart-define`; use `API_BASE_URL`
to override the Android emulator backend address.

## Storefront design

The app and [web storefront](../ecommerce-web/README.md) share a light, minimal
visual language: sky-blue primary actions, slate background, white cards with
16px corners, 12px control corners, and actions at least 44px high.
[AppTheme](lib/core/app_theme.dart) owns the native tokens.

Home and catalog reuse [ProductGrid](lib/widgets/product_card.dart): two columns
on phones from 320px, three on tablets, and four on wide screens. Cards reserve
space for wrapped prices and flash-sale details, including enlarged text.
Native typography uses the platform font; web uses Plus Jakarta Sans.
Navigation adapts to each platform's safe areas rather than being pixel-identical.

## Bahasa / Language

Every customer screen supports Bahasa Indonesia (default) and English. Use the
language menu above the main navigation or in the login/account app bar. The
choice is saved on this device; changing it preserves navigation, authentication,
cart, search, and in-progress forms. Storage failures keep the selected language
usable and expose a retry warning beside the switcher.

`lib/core/app_text.dart` is the typed source-level message catalog, including
parameterized messages. Material localization delegates translate native dialogs,
date pickers, validation controls, and accessibility labels. Display dates and
numbers follow the selected language; money stays IDR and delivery schedules stay
WIB (Asia/Jakarta). Request dates remain ISO and submitted business codes never
change with language.

Payment methods and known order-notification milestones use local templates.
Customer/catalog content, staff decision notes, branch names/addresses, unknown
notification types, and unknown API diagnostics are not machine-translated.
Known authentication and Q.33 business errors have explicit bilingual mappings
in `localized_errors.dart`; extend those mappings when adding backend rules.
No runtime text-tree rewriting or external translation service is used.

## Delivery rescheduling (P.33)

Order tracking uses the live order-number API. Signed-in customers can request
a new delivery date and morning (09:00-12:00) or afternoon (12:00-17:00) window.
All schedule times are WIB (Asia/Jakarta), independent of the device timezone.

Backend ownership and exact 24-hour cutoff checks are authoritative. A request
requires a pending delivery on a planned trip with a known departure time at
least 24 hours away; the requested window must also start at least 24 hours away.
One pending request per stop is allowed. Dispatch approval is required and only
the requested stop is reassigned, not the entire shared trip.

The tracking panel shows request/decision history and notes. Reopen tracking to
refresh decisions made later by dispatch. Missing schedules or API errors are
shown explicitly, without simulated reschedule success.
Apply V35/V36 and set planned dispatch times in management before use.

## Validation

After restoring dependencies with `flutter pub get`:

```sh
flutter analyze
flutter test
flutter build web
```

Responsive layout and shopping-action regressions are covered by
[storefront_style_test.dart](test/storefront_style_test.dart).
Language persistence, navigation/form preservation, currency formatting, business
error mapping, and English Q.33 history/requests are covered by
[localization_test.dart](test/localization_test.dart).
