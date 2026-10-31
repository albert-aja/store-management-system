# SMS Worker App

Flutter employee portal.

## Bahasa Indonesia / English

Indonesian is the default. The **ID / EN** menu is available on login and the
every authenticated screen toolbar. The choice is saved on this device, survives sign-out,
and changes presentation without rebuilding authentication, router or task state.
Storage failures appear above the workspace; select a language again to retry.

All authored screen, dialog, hardware, navigation, attendance, inventory, payroll,
sales-calculator and accessibility copy lives in `lib/l10n/app_id.arb` and
`app_en.arb`. Run `flutter gen-l10n` after editing either catalog. Flutter Material
delegates localize built-in menus, pickers and accessibility controls. Dates,
numbers and IDR grouping follow the selected language; currency remains Rupiah,
delivery windows remain WIB, and financial formulas are unchanged.

Source audit: over 600 catalog messages cover worker UI. Business/demo names,
addresses, product/customer/staff text, backend codes, photo-category identifiers,
callback URLs, submitted codes, existing records and internal diagnostic/event messages remain
unchanged deliberately. Known status/category codes are translated only at their
display sites; unknown backend text is preserved, not machine-translated.
Q.30 failures and persisted screen errors use deferred catalog messages so they
can be rendered in the current language.

Legacy widget tests explicitly select English. `test/localization_test.dart`
independently covers ID/EN, catalog parity, persisted selection, storage failures,
unchanged typed credentials, currency/WIB formatting, navigation across mounted
stops and unchanged financial results.

## Driver navigation (Q.30)

Pending/in-transit trip stops expose **Navigate** when verified destination
latitude/longitude are available. Choose Google Maps or Waze on Android;
iOS also supports Apple Maps. A successful choice is remembered on the device
for one-tap navigation; the adjacent menu changes the navigation app.

Only destination coordinates are shared, not customer name/phone/address or
worker tracking history. No geocoder, API key, browser fallback, or invented
coordinates are used. Missing/invalid GPS and missing map apps show explicit
guidance. Dispatch enters GPS when creating a delivery order in management;
backend migration V35 stores validated optional coordinate pairs.

Google Maps iOS receives an `smsworker://navigation/delivery/<tripId>` callback
with the stop ID. Platform URL registration and the authenticated router restore
the same assigned trip, including when sign-in is required. Waze, Apple Maps,
and Google Maps Android have no equivalent documented URL callback: use system
Back or app switching; the lifecycle resume callback keeps the current trip sheet
and reports the return. Return never confirms arrival/delivery or stops GPS tracking.
The OS may terminate a background app; only explicit Google Maps iOS deep links
restore the trip after termination. These callbacks do not report navigation completion.

## Validation

```sh
flutter pub get
flutter gen-l10n
flutter test
flutter analyze
flutter build apk --debug
```

Localization validation: clean analysis, all 38 tests passing, and Android debug
APK build successful. Native navigation still requires the device checks below.

Windows plugin setup requires Developer Mode/symlink support. Native map launches
and callback buttons must also be smoke-tested on physical Android/iOS devices
with the selected map apps installed; automated tests validate URLs, selection,
resume behavior, authenticated callback routing, and delivery API handling.
