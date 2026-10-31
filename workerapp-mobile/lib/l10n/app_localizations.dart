import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_id.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('id'),
  ];

  /// No description provided for @perMonth.
  ///
  /// In en, this message translates to:
  /// **'/ month'**
  String get perMonth;

  /// No description provided for @morning.
  ///
  /// In en, this message translates to:
  /// **'Morning'**
  String get morning;

  /// No description provided for @goods.
  ///
  /// In en, this message translates to:
  /// **'Goods'**
  String get goods;

  /// No description provided for @none.
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get none;

  /// No description provided for @notification.
  ///
  /// In en, this message translates to:
  /// **'Notification'**
  String get notification;

  /// No description provided for @open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get open;

  /// No description provided for @submitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted'**
  String get submitted;

  /// No description provided for @recount.
  ///
  /// In en, this message translates to:
  /// **'Recount Required'**
  String get recount;

  /// No description provided for @matched.
  ///
  /// In en, this message translates to:
  /// **'Matched'**
  String get matched;

  /// No description provided for @uncounted.
  ///
  /// In en, this message translates to:
  /// **'Uncounted'**
  String get uncounted;

  /// No description provided for @missing.
  ///
  /// In en, this message translates to:
  /// **'Missing'**
  String get missing;

  /// No description provided for @unexpected.
  ///
  /// In en, this message translates to:
  /// **'Unexpected'**
  String get unexpected;

  /// No description provided for @kept.
  ///
  /// In en, this message translates to:
  /// **'Kept'**
  String get kept;

  /// No description provided for @broken.
  ///
  /// In en, this message translates to:
  /// **'Broken'**
  String get broken;

  /// No description provided for @inTransit.
  ///
  /// In en, this message translates to:
  /// **'In Transit'**
  String get inTransit;

  /// No description provided for @unknown.
  ///
  /// In en, this message translates to:
  /// **'Unknown'**
  String get unknown;

  /// No description provided for @recipient.
  ///
  /// In en, this message translates to:
  /// **'Recipient'**
  String get recipient;

  /// No description provided for @compensation.
  ///
  /// In en, this message translates to:
  /// **'Compensation'**
  String get compensation;

  /// No description provided for @logistics.
  ///
  /// In en, this message translates to:
  /// **'Logistics'**
  String get logistics;

  /// No description provided for @finance.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get finance;

  /// No description provided for @worker.
  ///
  /// In en, this message translates to:
  /// **'Worker'**
  String get worker;

  /// No description provided for @supervisor.
  ///
  /// In en, this message translates to:
  /// **'Supervisor'**
  String get supervisor;

  /// No description provided for @annual.
  ///
  /// In en, this message translates to:
  /// **'Annual Leave'**
  String get annual;

  /// No description provided for @sick.
  ///
  /// In en, this message translates to:
  /// **'Sick Leave'**
  String get sick;

  /// No description provided for @maternity.
  ///
  /// In en, this message translates to:
  /// **'Maternity / Paternity'**
  String get maternity;

  /// No description provided for @other.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get other;

  /// No description provided for @incomeDefault.
  ///
  /// In en, this message translates to:
  /// **'Eligible for 12 months installment credit.'**
  String get incomeDefault;

  /// No description provided for @morningWindow.
  ///
  /// In en, this message translates to:
  /// **'Morning (09:00–12:00 WIB)'**
  String get morningWindow;

  /// No description provided for @afternoonWindow.
  ///
  /// In en, this message translates to:
  /// **'Afternoon (12:00–17:00 WIB)'**
  String get afternoonWindow;

  /// No description provided for @deliveryWindowValue.
  ///
  /// In en, this message translates to:
  /// **'Delivery window: {window}'**
  String deliveryWindowValue(String window);

  /// No description provided for @noNotes.
  ///
  /// In en, this message translates to:
  /// **'No notes'**
  String get noNotes;

  /// No description provided for @notAssigned.
  ///
  /// In en, this message translates to:
  /// **'Not assigned'**
  String get notAssigned;

  /// No description provided for @productItem.
  ///
  /// In en, this message translates to:
  /// **'Product Item'**
  String get productItem;

  /// No description provided for @noSession.
  ///
  /// In en, this message translates to:
  /// **'NO SESSION'**
  String get noSession;

  /// No description provided for @noDp.
  ///
  /// In en, this message translates to:
  /// **'No down payment for HD < Rp 5M'**
  String get noDp;

  /// No description provided for @priceBracket.
  ///
  /// In en, this message translates to:
  /// **'Based on price bracket'**
  String get priceBracket;

  /// No description provided for @taskLabel.
  ///
  /// In en, this message translates to:
  /// **'TASK'**
  String get taskLabel;

  /// No description provided for @formulaPrincipal.
  ///
  /// In en, this message translates to:
  /// **'(HD - DP) + Rp 30,000'**
  String get formulaPrincipal;

  /// No description provided for @formulaRounding.
  ///
  /// In en, this message translates to:
  /// **'Round(h4 / 5,000) × 5,000 + 5,000'**
  String get formulaRounding;

  /// No description provided for @removePhoto.
  ///
  /// In en, this message translates to:
  /// **'Remove photo'**
  String get removePhoto;

  /// No description provided for @capturePhoto.
  ///
  /// In en, this message translates to:
  /// **'Capture {category} photo'**
  String capturePhoto(String category);

  /// No description provided for @signatureCanvas.
  ///
  /// In en, this message translates to:
  /// **'Signature drawing area'**
  String get signatureCanvas;

  /// No description provided for @navigationPreferenceInvalid.
  ///
  /// In en, this message translates to:
  /// **'Saved navigation app is invalid. Choose a navigation app again.'**
  String get navigationPreferenceInvalid;

  /// No description provided for @navigationGpsInvalid.
  ///
  /// In en, this message translates to:
  /// **'Destination GPS is invalid. Ask dispatch to correct this stop.'**
  String get navigationGpsInvalid;

  /// No description provided for @navigationUnsupported.
  ///
  /// In en, this message translates to:
  /// **'{app} is not supported on this platform.'**
  String navigationUnsupported(String app);

  /// No description provided for @navigationStopRequired.
  ///
  /// In en, this message translates to:
  /// **'Trip and delivery stop are required.'**
  String get navigationStopRequired;

  /// No description provided for @navigationAppUnavailable.
  ///
  /// In en, this message translates to:
  /// **'{app} is unavailable. Install it or choose another navigation app.'**
  String navigationAppUnavailable(String app);

  /// No description provided for @navigationOpenFailed.
  ///
  /// In en, this message translates to:
  /// **'{app} could not open. Please retry.'**
  String navigationOpenFailed(String app);

  /// No description provided for @navigationPreferenceSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'Navigation opened, but app preference could not be saved.'**
  String get navigationPreferenceSaveFailed;

  /// No description provided for @gpsEnable.
  ///
  /// In en, this message translates to:
  /// **'Enable device location services and try again.'**
  String get gpsEnable;

  /// No description provided for @gpsDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permission was denied.'**
  String get gpsDenied;

  /// No description provided for @gpsBlocked.
  ///
  /// In en, this message translates to:
  /// **'Location permission is blocked. Enable it in system settings.'**
  String get gpsBlocked;

  /// No description provided for @requestFailed.
  ///
  /// In en, this message translates to:
  /// **'The operation could not be completed. Check your connection and retry.'**
  String get requestFailed;

  /// No description provided for @deliverySignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in to load your delivery trips.'**
  String get deliverySignIn;

  /// No description provided for @deliveryNotAssigned.
  ///
  /// In en, this message translates to:
  /// **'Requested trip is not assigned to this driver.'**
  String get deliveryNotAssigned;

  /// No description provided for @deliveryTripInvalid.
  ///
  /// In en, this message translates to:
  /// **'Invalid delivery trip response.'**
  String get deliveryTripInvalid;

  /// No description provided for @deliveryStopInvalid.
  ///
  /// In en, this message translates to:
  /// **'Invalid delivery stop response.'**
  String get deliveryStopInvalid;

  /// No description provided for @deliveryTripsFailed.
  ///
  /// In en, this message translates to:
  /// **'Delivery trips could not load. Check access or connection.'**
  String get deliveryTripsFailed;

  /// No description provided for @deliveryStopsFailed.
  ///
  /// In en, this message translates to:
  /// **'Delivery stops could not load. Check access or connection.'**
  String get deliveryStopsFailed;

  /// No description provided for @showPassword.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get showPassword;

  /// No description provided for @hidePassword.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get hidePassword;

  /// No description provided for @photoCaptured.
  ///
  /// In en, this message translates to:
  /// **'{count} / {total} Captured'**
  String photoCaptured(String count, String total);

  /// No description provided for @photoProofTitle.
  ///
  /// In en, this message translates to:
  /// **'{category} Proof'**
  String photoProofTitle(String category);

  /// No description provided for @navigate.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get navigate;

  /// No description provided for @navigateWithApp.
  ///
  /// In en, this message translates to:
  /// **'Navigate - {app}'**
  String navigateWithApp(String app);

  /// No description provided for @present.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get present;

  /// No description provided for @late.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get late;

  /// No description provided for @onLeave.
  ///
  /// In en, this message translates to:
  /// **'On Leave'**
  String get onLeave;

  /// No description provided for @halfDay.
  ///
  /// In en, this message translates to:
  /// **'Half Day'**
  String get halfDay;

  /// No description provided for @absent.
  ///
  /// In en, this message translates to:
  /// **'Absent'**
  String get absent;

  /// No description provided for @pending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// No description provided for @approved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get approved;

  /// No description provided for @rejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get rejected;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @planned.
  ///
  /// In en, this message translates to:
  /// **'Planned'**
  String get planned;

  /// No description provided for @dispatched.
  ///
  /// In en, this message translates to:
  /// **'Dispatched'**
  String get dispatched;

  /// No description provided for @delivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get delivered;

  /// No description provided for @failed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get failed;

  /// No description provided for @assigned.
  ///
  /// In en, this message translates to:
  /// **'Assigned'**
  String get assigned;

  /// No description provided for @paid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get paid;

  /// No description provided for @unpaid.
  ///
  /// In en, this message translates to:
  /// **'Unpaid'**
  String get unpaid;

  /// No description provided for @inProgress.
  ///
  /// In en, this message translates to:
  /// **'In Progress'**
  String get inProgress;

  /// No description provided for @draft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get draft;

  /// No description provided for @confirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get confirmed;

  /// No description provided for @surveyRejected.
  ///
  /// In en, this message translates to:
  /// **'Survey Rejected'**
  String get surveyRejected;

  /// No description provided for @handedOver.
  ///
  /// In en, this message translates to:
  /// **'Handed Over'**
  String get handedOver;

  /// No description provided for @cashVerified.
  ///
  /// In en, this message translates to:
  /// **'Cash Verified'**
  String get cashVerified;

  /// No description provided for @vipCash.
  ///
  /// In en, this message translates to:
  /// **'VIP Cash'**
  String get vipCash;

  /// No description provided for @starCredit.
  ///
  /// In en, this message translates to:
  /// **'Star Credit'**
  String get starCredit;

  /// No description provided for @highRisk.
  ///
  /// In en, this message translates to:
  /// **'High Delinquency Risk'**
  String get highRisk;

  /// No description provided for @general.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get general;

  /// No description provided for @notificationPause.
  ///
  /// In en, this message translates to:
  /// **'Manual resume required'**
  String get notificationPause;

  /// No description provided for @trackingTitle.
  ///
  /// In en, this message translates to:
  /// **'SMS Field Telematics Active'**
  String get trackingTitle;

  /// No description provided for @trackingBounded.
  ///
  /// In en, this message translates to:
  /// **'Tracking bounded to assigned operational task'**
  String get trackingBounded;

  /// No description provided for @trackingNotStarted.
  ///
  /// In en, this message translates to:
  /// **'Task not started'**
  String get trackingNotStarted;

  /// No description provided for @trackingComplete.
  ///
  /// In en, this message translates to:
  /// **'Task completed'**
  String get trackingComplete;

  /// No description provided for @trackingBreak.
  ///
  /// In en, this message translates to:
  /// **'Scheduled break'**
  String get trackingBreak;

  /// No description provided for @trackingManual.
  ///
  /// In en, this message translates to:
  /// **'Tracking paused'**
  String get trackingManual;

  /// No description provided for @trackingThermal.
  ///
  /// In en, this message translates to:
  /// **'Thermal safety cutoff'**
  String get trackingThermal;

  /// No description provided for @trackingLowBattery.
  ///
  /// In en, this message translates to:
  /// **'Low battery; reduced GPS frequency'**
  String get trackingLowBattery;

  /// No description provided for @trackingActive.
  ///
  /// In en, this message translates to:
  /// **'GPS tracking active'**
  String get trackingActive;

  /// No description provided for @trackingSystemPause.
  ///
  /// In en, this message translates to:
  /// **'Quick pause via system notification action'**
  String get trackingSystemPause;

  /// No description provided for @trackingLunch.
  ///
  /// In en, this message translates to:
  /// **'Lunch break automatic pause'**
  String get trackingLunch;

  /// No description provided for @trackingResume.
  ///
  /// In en, this message translates to:
  /// **'Manual resume by employee'**
  String get trackingResume;

  /// No description provided for @simulationTitle.
  ///
  /// In en, this message translates to:
  /// **'📋 *SMS STORE CREDIT SIMULATION*'**
  String get simulationTitle;

  /// No description provided for @simulationProduct.
  ///
  /// In en, this message translates to:
  /// **'Product: *{product}*'**
  String simulationProduct(String product);

  /// No description provided for @simulationPrice.
  ///
  /// In en, this message translates to:
  /// **'Base Price: *{price}*'**
  String simulationPrice(String price);

  /// No description provided for @simulationDp.
  ///
  /// In en, this message translates to:
  /// **'Down Payment (DP): *{amount}* ({percentage}%)'**
  String simulationDp(String amount, String percentage);

  /// No description provided for @simulationOptions.
  ///
  /// In en, this message translates to:
  /// **'MONTHLY INSTALLMENT OPTIONS:'**
  String get simulationOptions;

  /// No description provided for @simulationTerm.
  ///
  /// In en, this message translates to:
  /// **'• *{months} Months*: {amount} / month'**
  String simulationTerm(String months, String amount);

  /// No description provided for @simulationTotal.
  ///
  /// In en, this message translates to:
  /// **'   (Total: {total}, Discount Savings: {saved}/month)'**
  String simulationTotal(String total, String saved);

  /// No description provided for @simulationDiscount.
  ///
  /// In en, this message translates to:
  /// **'💡 *15% timely payment incentive discount is included in installments.*'**
  String get simulationDiscount;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'SMS Worker Portal'**
  String get appTitle;

  /// No description provided for @languagePersistenceFailed.
  ///
  /// In en, this message translates to:
  /// **'Language preference could not be loaded or saved. Choose ID/EN to retry.'**
  String get languagePersistenceFailed;

  /// No description provided for @message1.
  ///
  /// In en, this message translates to:
  /// **'Manual Tracking Pause'**
  String get message1;

  /// No description provided for @message2.
  ///
  /// In en, this message translates to:
  /// **'Enter exceptional reason for pausing GPS tracking (e.g. vehicle repair, flat tire, emergency):'**
  String get message2;

  /// No description provided for @message3.
  ///
  /// In en, this message translates to:
  /// **'Pause Reason'**
  String get message3;

  /// No description provided for @message4.
  ///
  /// In en, this message translates to:
  /// **'e.g. Flat tire, changing tire'**
  String get message4;

  /// No description provided for @message5.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get message5;

  /// No description provided for @message6.
  ///
  /// In en, this message translates to:
  /// **'Pause Tracking'**
  String get message6;

  /// No description provided for @message7.
  ///
  /// In en, this message translates to:
  /// **'🎯 Proximity Alert'**
  String get message7;

  /// No description provided for @message8.
  ///
  /// In en, this message translates to:
  /// **'{arg0}m away'**
  String message8(String arg0);

  /// No description provided for @message9.
  ///
  /// In en, this message translates to:
  /// **'Dismiss'**
  String get message9;

  /// No description provided for @message10.
  ///
  /// In en, this message translates to:
  /// **'GPS Tracking Standby • Activates strictly upon task initiation'**
  String get message10;

  /// No description provided for @message11.
  ///
  /// In en, this message translates to:
  /// **'Operational Task & GPS Tracking Completed'**
  String get message11;

  /// No description provided for @message12.
  ///
  /// In en, this message translates to:
  /// **'Thermal Cutoff Active ({arg0}°C > 45°C)'**
  String message12(String arg0);

  /// No description provided for @message13.
  ///
  /// In en, this message translates to:
  /// **'Continuous GPS pinging suspended to prevent device battery overheating under direct sunlight. Auto-resumes when cooled <=40°C.'**
  String get message13;

  /// No description provided for @message14.
  ///
  /// In en, this message translates to:
  /// **'GPS Paused — Scheduled Break Enforced'**
  String get message14;

  /// No description provided for @message15.
  ///
  /// In en, this message translates to:
  /// **'Zero coordinates collected during break window (UU PDP No. 27/2022).'**
  String get message15;

  /// No description provided for @message16.
  ///
  /// In en, this message translates to:
  /// **'Tracking Paused: {arg0}'**
  String message16(String arg0);

  /// No description provided for @message17.
  ///
  /// In en, this message translates to:
  /// **'Resume'**
  String get message17;

  /// No description provided for @message18.
  ///
  /// In en, this message translates to:
  /// **'GPS Tracking Active'**
  String get message18;

  /// No description provided for @message19.
  ///
  /// In en, this message translates to:
  /// **'Task bounded • Low Battery ({arg0}%) • {arg1}°C • Throttled 60s'**
  String message19(String arg0, String arg1);

  /// No description provided for @message20.
  ///
  /// In en, this message translates to:
  /// **'Task bounded • {arg0} km/h • {arg1}°C • {arg2} pings'**
  String message20(String arg0, String arg1, String arg2);

  /// No description provided for @message21.
  ///
  /// In en, this message translates to:
  /// **'Quick Pause'**
  String get message21;

  /// No description provided for @message22.
  ///
  /// In en, this message translates to:
  /// **'Reason...'**
  String get message22;

  /// No description provided for @message23.
  ///
  /// In en, this message translates to:
  /// **'Notification Tray: {arg0}'**
  String message23(String arg0);

  /// No description provided for @message24.
  ///
  /// In en, this message translates to:
  /// **'DISMISS ALERT'**
  String get message24;

  /// No description provided for @message25.
  ///
  /// In en, this message translates to:
  /// **'NOTIF PAUSE'**
  String get message25;

  /// No description provided for @message26.
  ///
  /// In en, this message translates to:
  /// **'NOTIF RESUME'**
  String get message26;

  /// No description provided for @message27.
  ///
  /// In en, this message translates to:
  /// **'Scan Barcode / QR Code'**
  String get message27;

  /// No description provided for @message28.
  ///
  /// In en, this message translates to:
  /// **'Align serial number barcode or QR within frame'**
  String get message28;

  /// No description provided for @message29.
  ///
  /// In en, this message translates to:
  /// **'Camera unavailable: {arg0}'**
  String message29(String arg0);

  /// No description provided for @message30.
  ///
  /// In en, this message translates to:
  /// **'Could not toggle flashlight: {arg0}'**
  String message30(String arg0);

  /// No description provided for @message31.
  ///
  /// In en, this message translates to:
  /// **'Toggle flashlight'**
  String get message31;

  /// No description provided for @message32.
  ///
  /// In en, this message translates to:
  /// **'Enter code manually'**
  String get message32;

  /// No description provided for @message33.
  ///
  /// In en, this message translates to:
  /// **'Enter'**
  String get message33;

  /// No description provided for @message34.
  ///
  /// In en, this message translates to:
  /// **'Field Photo Evidence'**
  String get message34;

  /// No description provided for @message35.
  ///
  /// In en, this message translates to:
  /// **'Tap to capture'**
  String get message35;

  /// No description provided for @message36.
  ///
  /// In en, this message translates to:
  /// **'Signatory: {arg0}'**
  String message36(String arg0);

  /// No description provided for @message37.
  ///
  /// In en, this message translates to:
  /// **'Sign above line with finger or stylus'**
  String get message37;

  /// No description provided for @message38.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get message38;

  /// No description provided for @message39.
  ///
  /// In en, this message translates to:
  /// **'Apply Signature'**
  String get message39;

  /// No description provided for @message40.
  ///
  /// In en, this message translates to:
  /// **'Please enter a reason for the leave request'**
  String get message40;

  /// No description provided for @message41.
  ///
  /// In en, this message translates to:
  /// **'Leave request submitted to Store Manager for approval'**
  String get message41;

  /// No description provided for @message42.
  ///
  /// In en, this message translates to:
  /// **'Failed to submit leave request'**
  String get message42;

  /// No description provided for @message43.
  ///
  /// In en, this message translates to:
  /// **'Attendance & Leaves'**
  String get message43;

  /// No description provided for @message44.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get message44;

  /// No description provided for @message45.
  ///
  /// In en, this message translates to:
  /// **'Attendance Log'**
  String get message45;

  /// No description provided for @message46.
  ///
  /// In en, this message translates to:
  /// **'Apply Leave'**
  String get message46;

  /// No description provided for @message47.
  ///
  /// In en, this message translates to:
  /// **'No attendance logs found.'**
  String get message47;

  /// No description provided for @message48.
  ///
  /// In en, this message translates to:
  /// **'In: {arg0}  •  Out: {arg1}'**
  String message48(String arg0, String arg1);

  /// No description provided for @message49.
  ///
  /// In en, this message translates to:
  /// **'Leave Request Form'**
  String get message49;

  /// No description provided for @message50.
  ///
  /// In en, this message translates to:
  /// **'Leave Category'**
  String get message50;

  /// No description provided for @message51.
  ///
  /// In en, this message translates to:
  /// **'Annual Leave (Paid)'**
  String get message51;

  /// No description provided for @message52.
  ///
  /// In en, this message translates to:
  /// **'Sick Leave (Doctor\'s Note)'**
  String get message52;

  /// No description provided for @message53.
  ///
  /// In en, this message translates to:
  /// **'Unpaid Leave / Permission'**
  String get message53;

  /// No description provided for @message54.
  ///
  /// In en, this message translates to:
  /// **'Maternity / Paternity'**
  String get message54;

  /// No description provided for @message55.
  ///
  /// In en, this message translates to:
  /// **'Special / Compassionate'**
  String get message55;

  /// No description provided for @message56.
  ///
  /// In en, this message translates to:
  /// **'Start Date'**
  String get message56;

  /// No description provided for @message57.
  ///
  /// In en, this message translates to:
  /// **'End Date'**
  String get message57;

  /// No description provided for @message58.
  ///
  /// In en, this message translates to:
  /// **'Reason & Justification'**
  String get message58;

  /// No description provided for @message59.
  ///
  /// In en, this message translates to:
  /// **'Describe necessity and handover coverage...'**
  String get message59;

  /// No description provided for @message60.
  ///
  /// In en, this message translates to:
  /// **'Submit Request for Approval'**
  String get message60;

  /// No description provided for @message61.
  ///
  /// In en, this message translates to:
  /// **'Please enter both email and password'**
  String get message61;

  /// No description provided for @message62.
  ///
  /// In en, this message translates to:
  /// **'SMS Worker App'**
  String get message62;

  /// No description provided for @message63.
  ///
  /// In en, this message translates to:
  /// **'Field operations, tasks, attendance & personal records'**
  String get message63;

  /// No description provided for @message64.
  ///
  /// In en, this message translates to:
  /// **'Work Email'**
  String get message64;

  /// No description provided for @message65.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get message65;

  /// No description provided for @message66.
  ///
  /// In en, this message translates to:
  /// **'Sign In to Worker Workspace'**
  String get message66;

  /// No description provided for @message67.
  ///
  /// In en, this message translates to:
  /// **'Quick Demo Roles:'**
  String get message67;

  /// No description provided for @message68.
  ///
  /// In en, this message translates to:
  /// **'Driver'**
  String get message68;

  /// No description provided for @message69.
  ///
  /// In en, this message translates to:
  /// **'Surveyor'**
  String get message69;

  /// No description provided for @message70.
  ///
  /// In en, this message translates to:
  /// **'Collector'**
  String get message70;

  /// No description provided for @message71.
  ///
  /// In en, this message translates to:
  /// **'Salesperson'**
  String get message71;

  /// No description provided for @message72.
  ///
  /// In en, this message translates to:
  /// **'Manager'**
  String get message72;

  /// No description provided for @message73.
  ///
  /// In en, this message translates to:
  /// **'Helper'**
  String get message73;

  /// No description provided for @message74.
  ///
  /// In en, this message translates to:
  /// **'Sales Commission Tier & Target Policy (2026)'**
  String get message74;

  /// No description provided for @message75.
  ///
  /// In en, this message translates to:
  /// **'Sales commission is tier-based, evaluated against confirmed sales orders. Confirmation includes customer attestation and DP where applicable. Reached tier rate applies to the entire eligible amount.'**
  String get message75;

  /// No description provided for @message76.
  ///
  /// In en, this message translates to:
  /// **'Pre-Delivery Vehicle & Goods Inspection SOP'**
  String get message76;

  /// No description provided for @message77.
  ///
  /// In en, this message translates to:
  /// **'Drivers and helpers must complete the mandatory checklist before dispatching: tires, brakes, fuel, straps, and stock unit serial matching with Surat Jalan.'**
  String get message77;

  /// No description provided for @message78.
  ///
  /// In en, this message translates to:
  /// **'Cash Custody & Handover Policy for Field Workers'**
  String get message78;

  /// No description provided for @message79.
  ///
  /// In en, this message translates to:
  /// **'All cash collected from COD deliveries and field visits is held under collector custody until physically verified by the store cashier. Any short/over discrepancy must be documented.'**
  String get message79;

  /// No description provided for @message80.
  ///
  /// In en, this message translates to:
  /// **'Credit Survey Standards & Decisive Authority'**
  String get message80;

  /// No description provided for @message81.
  ///
  /// In en, this message translates to:
  /// **'Surveyors possess decisive approval authority on customer credit viability. Verify residence ownership, electricity bills, and original identity documents.'**
  String get message81;

  /// No description provided for @message82.
  ///
  /// In en, this message translates to:
  /// **'Non-Calendar Sales Period Cutoff Guidelines'**
  String get message82;

  /// No description provided for @message83.
  ///
  /// In en, this message translates to:
  /// **'HR / PAYROLL'**
  String get message83;

  /// No description provided for @message84.
  ///
  /// In en, this message translates to:
  /// **'Compensation periods end on the Sunday containing the target month final calendar day. Payout is processed on the Monday following cutoff.'**
  String get message84;

  /// No description provided for @message85.
  ///
  /// In en, this message translates to:
  /// **'Office Bulletin & SOPs'**
  String get message85;

  /// No description provided for @message86.
  ///
  /// In en, this message translates to:
  /// **'Search rules, guidelines, commission tiers...'**
  String get message86;

  /// No description provided for @message87.
  ///
  /// In en, this message translates to:
  /// **'Collection not recorded; GPS unavailable: {arg0}'**
  String message87(String arg0);

  /// No description provided for @message88.
  ///
  /// In en, this message translates to:
  /// **'Field Collection Visit'**
  String get message88;

  /// No description provided for @message89.
  ///
  /// In en, this message translates to:
  /// **'Field collection outcome recorded: {arg0} with GPS verification'**
  String message89(String arg0);

  /// No description provided for @message90.
  ///
  /// In en, this message translates to:
  /// **'Failed to record collection attempt'**
  String get message90;

  /// No description provided for @message91.
  ///
  /// In en, this message translates to:
  /// **'Hand Over Cash to Cashier'**
  String get message91;

  /// No description provided for @message92.
  ///
  /// In en, this message translates to:
  /// **'Confirm handover of Rp {arg0} to store cashier? Status will change to HANDED_OVER awaiting cashier verification.'**
  String message92(String arg0);

  /// No description provided for @message93.
  ///
  /// In en, this message translates to:
  /// **'Cash custody handed over to cashier successfully!'**
  String get message93;

  /// No description provided for @message94.
  ///
  /// In en, this message translates to:
  /// **'Confirm Handover'**
  String get message94;

  /// No description provided for @message95.
  ///
  /// In en, this message translates to:
  /// **'Field Collection Visit'**
  String get message95;

  /// No description provided for @message96.
  ///
  /// In en, this message translates to:
  /// **'Cash Custody in Hand:'**
  String get message96;

  /// No description provided for @message97.
  ///
  /// In en, this message translates to:
  /// **'Hand Over Cash'**
  String get message97;

  /// No description provided for @message98.
  ///
  /// In en, this message translates to:
  /// **'Account: REC/JKT/10/2026/0088'**
  String get message98;

  /// No description provided for @message99.
  ///
  /// In en, this message translates to:
  /// **'14 DAYS OVERDUE'**
  String get message99;

  /// No description provided for @message100.
  ///
  /// In en, this message translates to:
  /// **'Phone: 0811-2233-4455  •  Installment #3 of 12'**
  String get message100;

  /// No description provided for @message101.
  ///
  /// In en, this message translates to:
  /// **'Address: Jl. Pancoran Barat III No. 22, RT 04/RW 02'**
  String get message101;

  /// No description provided for @message102.
  ///
  /// In en, this message translates to:
  /// **'Overdue Installment Amount:'**
  String get message102;

  /// No description provided for @message103.
  ///
  /// In en, this message translates to:
  /// **'Open Customer 360 Profile & CRM History'**
  String get message103;

  /// No description provided for @message104.
  ///
  /// In en, this message translates to:
  /// **'Record Visit Outcome'**
  String get message104;

  /// No description provided for @message105.
  ///
  /// In en, this message translates to:
  /// **'Outcome Classification'**
  String get message105;

  /// No description provided for @message106.
  ///
  /// In en, this message translates to:
  /// **'Paid in Full (Cash Handover)'**
  String get message106;

  /// No description provided for @message107.
  ///
  /// In en, this message translates to:
  /// **'Paid via Bank Transfer'**
  String get message107;

  /// No description provided for @message108.
  ///
  /// In en, this message translates to:
  /// **'Promised to Pay (PTP Date)'**
  String get message108;

  /// No description provided for @message109.
  ///
  /// In en, this message translates to:
  /// **'Customer Not at Home'**
  String get message109;

  /// No description provided for @message110.
  ///
  /// In en, this message translates to:
  /// **'Refused Payment / Dispute'**
  String get message110;

  /// No description provided for @message111.
  ///
  /// In en, this message translates to:
  /// **'Collected Amount (Rp)'**
  String get message111;

  /// No description provided for @message112.
  ///
  /// In en, this message translates to:
  /// **'Installment Payment Receipt'**
  String get message112;

  /// No description provided for @message113.
  ///
  /// In en, this message translates to:
  /// **'Payer Signature Captured'**
  String get message113;

  /// No description provided for @message114.
  ///
  /// In en, this message translates to:
  /// **'Customer Payment Signature'**
  String get message114;

  /// No description provided for @message115.
  ///
  /// In en, this message translates to:
  /// **'Promised Payment Date'**
  String get message115;

  /// No description provided for @message116.
  ///
  /// In en, this message translates to:
  /// **'Location Evidence'**
  String get message116;

  /// No description provided for @message117.
  ///
  /// In en, this message translates to:
  /// **'Receipt Voucher'**
  String get message117;

  /// No description provided for @message118.
  ///
  /// In en, this message translates to:
  /// **'Collector Notes & Field Evidence'**
  String get message118;

  /// No description provided for @message119.
  ///
  /// In en, this message translates to:
  /// **'Describe conversation outcome, obstacles, customer statement...'**
  String get message119;

  /// No description provided for @message120.
  ///
  /// In en, this message translates to:
  /// **'Save Field Visit Record'**
  String get message120;

  /// No description provided for @message121.
  ///
  /// In en, this message translates to:
  /// **'Record Promise to Pay (PTP)'**
  String get message121;

  /// No description provided for @message122.
  ///
  /// In en, this message translates to:
  /// **'Promised Amount (Rp)'**
  String get message122;

  /// No description provided for @message123.
  ///
  /// In en, this message translates to:
  /// **'Promised Payment Date'**
  String get message123;

  /// No description provided for @message124.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get message124;

  /// No description provided for @message125.
  ///
  /// In en, this message translates to:
  /// **'Customer Notes / Reason'**
  String get message125;

  /// No description provided for @message126.
  ///
  /// In en, this message translates to:
  /// **'Save Promise to Pay'**
  String get message126;

  /// No description provided for @message127.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid promised amount'**
  String get message127;

  /// No description provided for @message128.
  ///
  /// In en, this message translates to:
  /// **'Promise to pay recorded & queued for sync'**
  String get message128;

  /// No description provided for @message129.
  ///
  /// In en, this message translates to:
  /// **'Field Visit / Follow-up'**
  String get message129;

  /// No description provided for @message130.
  ///
  /// In en, this message translates to:
  /// **'Interaction / Visit Log'**
  String get message130;

  /// No description provided for @message131.
  ///
  /// In en, this message translates to:
  /// **'Communication Channel'**
  String get message131;

  /// No description provided for @message132.
  ///
  /// In en, this message translates to:
  /// **'In-person Visit'**
  String get message132;

  /// No description provided for @message133.
  ///
  /// In en, this message translates to:
  /// **'Phone Call'**
  String get message133;

  /// No description provided for @message134.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp Chat'**
  String get message134;

  /// No description provided for @message135.
  ///
  /// In en, this message translates to:
  /// **'Interaction Outcome'**
  String get message135;

  /// No description provided for @message136.
  ///
  /// In en, this message translates to:
  /// **'Reached / Met'**
  String get message136;

  /// No description provided for @message137.
  ///
  /// In en, this message translates to:
  /// **'Agreed Promise to Pay'**
  String get message137;

  /// No description provided for @message138.
  ///
  /// In en, this message translates to:
  /// **'No Answer / Empty Home'**
  String get message138;

  /// No description provided for @message139.
  ///
  /// In en, this message translates to:
  /// **'Refused / Complaint'**
  String get message139;

  /// No description provided for @message140.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get message140;

  /// No description provided for @message141.
  ///
  /// In en, this message translates to:
  /// **'Full Conversation Notes'**
  String get message141;

  /// No description provided for @message142.
  ///
  /// In en, this message translates to:
  /// **'Save Interaction Log'**
  String get message142;

  /// No description provided for @message143.
  ///
  /// In en, this message translates to:
  /// **'CRM interaction saved'**
  String get message143;

  /// No description provided for @message144.
  ///
  /// In en, this message translates to:
  /// **'Customer 360 CRM'**
  String get message144;

  /// No description provided for @message145.
  ///
  /// In en, this message translates to:
  /// **'Refresh Data'**
  String get message145;

  /// No description provided for @message146.
  ///
  /// In en, this message translates to:
  /// **'Customer data not found'**
  String get message146;

  /// No description provided for @message147.
  ///
  /// In en, this message translates to:
  /// **'NIK: {arg0} • {arg1}'**
  String message147(String arg0, String arg1);

  /// No description provided for @message148.
  ///
  /// In en, this message translates to:
  /// **'Score {arg0}/100'**
  String message148(String arg0);

  /// No description provided for @message149.
  ///
  /// In en, this message translates to:
  /// **'Customer Lifetime Value'**
  String get message149;

  /// No description provided for @message150.
  ///
  /// In en, this message translates to:
  /// **'Store Credit Balance'**
  String get message150;

  /// No description provided for @message151.
  ///
  /// In en, this message translates to:
  /// **'Active Promises to Pay'**
  String get message151;

  /// No description provided for @message152.
  ///
  /// In en, this message translates to:
  /// **'{arg0} PTP'**
  String message152(String arg0);

  /// No description provided for @message153.
  ///
  /// In en, this message translates to:
  /// **'Total Completed Orders'**
  String get message153;

  /// No description provided for @message154.
  ///
  /// In en, this message translates to:
  /// **'{arg0} Orders'**
  String message154(String arg0);

  /// No description provided for @message155.
  ///
  /// In en, this message translates to:
  /// **'Record Promise to Pay'**
  String get message155;

  /// No description provided for @message156.
  ///
  /// In en, this message translates to:
  /// **'Interaction Log'**
  String get message156;

  /// No description provided for @message157.
  ///
  /// In en, this message translates to:
  /// **'Demographic & Characteristic Tags'**
  String get message157;

  /// No description provided for @message158.
  ///
  /// In en, this message translates to:
  /// **'Promises to Pay (PTP)'**
  String get message158;

  /// No description provided for @message159.
  ///
  /// In en, this message translates to:
  /// **'No promises to pay recorded'**
  String get message159;

  /// No description provided for @message160.
  ///
  /// In en, this message translates to:
  /// **'Due: {arg0}\n{arg1}'**
  String message160(String arg0, String arg1);

  /// No description provided for @message161.
  ///
  /// In en, this message translates to:
  /// **'Recent CRM Interaction History'**
  String get message161;

  /// No description provided for @message162.
  ///
  /// In en, this message translates to:
  /// **'No interaction history'**
  String get message162;

  /// No description provided for @message163.
  ///
  /// In en, this message translates to:
  /// **'Outcome: {arg0}\n{arg1}'**
  String message163(String arg0, String arg1);

  /// No description provided for @message164.
  ///
  /// In en, this message translates to:
  /// **'Delivery order returned invalid data.'**
  String get message164;

  /// No description provided for @message165.
  ///
  /// In en, this message translates to:
  /// **'Delivery order unavailable: {arg0}'**
  String message165(String arg0);

  /// No description provided for @message166.
  ///
  /// In en, this message translates to:
  /// **'Delivery Order'**
  String get message166;

  /// No description provided for @message167.
  ///
  /// In en, this message translates to:
  /// **'{arg0}\nStatus: {arg1}'**
  String message167(String arg0, String arg1);

  /// No description provided for @message168.
  ///
  /// In en, this message translates to:
  /// **'Failure reason'**
  String get message168;

  /// No description provided for @message169.
  ///
  /// In en, this message translates to:
  /// **'Packing manifest'**
  String get message169;

  /// No description provided for @message170.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get message170;

  /// No description provided for @message171.
  ///
  /// In en, this message translates to:
  /// **'Serial: {arg0}'**
  String message171(String arg0);

  /// No description provided for @message172.
  ///
  /// In en, this message translates to:
  /// **'Returned to trip sheet. Navigation does not confirm arrival or delivery.'**
  String get message172;

  /// No description provided for @message173.
  ///
  /// In en, this message translates to:
  /// **'Scan Delivery Barcode'**
  String get message173;

  /// No description provided for @message174.
  ///
  /// In en, this message translates to:
  /// **'Scan Delivery Note QR or Stock Unit Serial'**
  String get message174;

  /// No description provided for @message175.
  ///
  /// In en, this message translates to:
  /// **'Scanned barcode verified: {arg0}'**
  String message175(String arg0);

  /// No description provided for @message176.
  ///
  /// In en, this message translates to:
  /// **'Confirm Delivery Handover'**
  String get message176;

  /// No description provided for @message177.
  ///
  /// In en, this message translates to:
  /// **'Delivery Note: {arg0}'**
  String message177(String arg0);

  /// No description provided for @message178.
  ///
  /// In en, this message translates to:
  /// **'Recipient Full Name'**
  String get message178;

  /// No description provided for @message179.
  ///
  /// In en, this message translates to:
  /// **'Recipient Phone'**
  String get message179;

  /// No description provided for @message180.
  ///
  /// In en, this message translates to:
  /// **'COD Cash Collected (Rp)'**
  String get message180;

  /// No description provided for @message181.
  ///
  /// In en, this message translates to:
  /// **'Delivery Note {arg0} Handover'**
  String message181(String arg0);

  /// No description provided for @message182.
  ///
  /// In en, this message translates to:
  /// **'Signature Captured'**
  String get message182;

  /// No description provided for @message183.
  ///
  /// In en, this message translates to:
  /// **'Customer Digital Signature'**
  String get message183;

  /// No description provided for @message184.
  ///
  /// In en, this message translates to:
  /// **'Goods Handover'**
  String get message184;

  /// No description provided for @message185.
  ///
  /// In en, this message translates to:
  /// **'Signed Delivery Note'**
  String get message185;

  /// No description provided for @message186.
  ///
  /// In en, this message translates to:
  /// **'Delivery not confirmed; GPS unavailable: {arg0}'**
  String message186(String arg0);

  /// No description provided for @message187.
  ///
  /// In en, this message translates to:
  /// **'Handover verified via GPS [{arg0}, {arg1}]. Signature captured: {arg2}. Photos: {arg3}'**
  String message187(String arg0, String arg1, String arg2, String arg3);

  /// No description provided for @message188.
  ///
  /// In en, this message translates to:
  /// **'Delivery confirmed.'**
  String get message188;

  /// No description provided for @message189.
  ///
  /// In en, this message translates to:
  /// **'Delivery was not confirmed by server. Check connection and retry.'**
  String get message189;

  /// No description provided for @message190.
  ///
  /// In en, this message translates to:
  /// **'Report Delivery Failure'**
  String get message190;

  /// No description provided for @message191.
  ///
  /// In en, this message translates to:
  /// **'Failure Reason'**
  String get message191;

  /// No description provided for @message192.
  ///
  /// In en, this message translates to:
  /// **'Customer Unreachable / Not Home'**
  String get message192;

  /// No description provided for @message193.
  ///
  /// In en, this message translates to:
  /// **'Wrong / Incomplete Address'**
  String get message193;

  /// No description provided for @message194.
  ///
  /// In en, this message translates to:
  /// **'Customer Refused Goods'**
  String get message194;

  /// No description provided for @message195.
  ///
  /// In en, this message translates to:
  /// **'Item Damaged in Transit'**
  String get message195;

  /// No description provided for @message196.
  ///
  /// In en, this message translates to:
  /// **'Operational Notes'**
  String get message196;

  /// No description provided for @message197.
  ///
  /// In en, this message translates to:
  /// **'Delivery Failure Proof'**
  String get message197;

  /// No description provided for @message198.
  ///
  /// In en, this message translates to:
  /// **'Failure not reported; GPS unavailable: {arg0}'**
  String message198(String arg0);

  /// No description provided for @message199.
  ///
  /// In en, this message translates to:
  /// **'{arg0} GPS: {arg1}, {arg2}. Failure proof photos: {arg3}.'**
  String message199(String arg0, String arg1, String arg2, String arg3);

  /// No description provided for @message200.
  ///
  /// In en, this message translates to:
  /// **'Failure report submitted. Dispatcher must reschedule delivery.'**
  String get message200;

  /// No description provided for @message201.
  ///
  /// In en, this message translates to:
  /// **'Report not saved: {arg0}'**
  String message201(String arg0);

  /// No description provided for @message202.
  ///
  /// In en, this message translates to:
  /// **'Submit Failure Report'**
  String get message202;

  /// No description provided for @message203.
  ///
  /// In en, this message translates to:
  /// **'Driver Trip Execution'**
  String get message203;

  /// No description provided for @message204.
  ///
  /// In en, this message translates to:
  /// **'Trip: {arg0}'**
  String message204(String arg0);

  /// No description provided for @message205.
  ///
  /// In en, this message translates to:
  /// **'Barcode Scanner'**
  String get message205;

  /// No description provided for @message206.
  ///
  /// In en, this message translates to:
  /// **'Vehicle not assigned'**
  String get message206;

  /// No description provided for @message207.
  ///
  /// In en, this message translates to:
  /// **'No trip loaded'**
  String get message207;

  /// No description provided for @message208.
  ///
  /// In en, this message translates to:
  /// **'{arg0} / {arg1} Drops'**
  String message208(String arg0, String arg1);

  /// No description provided for @message209.
  ///
  /// In en, this message translates to:
  /// **'COD Custody Cash Balance:'**
  String get message209;

  /// No description provided for @message210.
  ///
  /// In en, this message translates to:
  /// **'No active delivery stops for this trip.'**
  String get message210;

  /// No description provided for @message211.
  ///
  /// In en, this message translates to:
  /// **'Stop #{arg0}  •  {arg1}'**
  String message211(String arg0, String arg1);

  /// No description provided for @message212.
  ///
  /// In en, this message translates to:
  /// **'Phone: {arg0}'**
  String message212(String arg0);

  /// No description provided for @message213.
  ///
  /// In en, this message translates to:
  /// **'Address: {arg0}'**
  String message213(String arg0);

  /// No description provided for @message214.
  ///
  /// In en, this message translates to:
  /// **'Delivery window: {arg0} WIB'**
  String message214(String arg0);

  /// No description provided for @message215.
  ///
  /// In en, this message translates to:
  /// **'{arg0} (SN: {arg1})'**
  String message215(String arg0, String arg1);

  /// No description provided for @message216.
  ///
  /// In en, this message translates to:
  /// **'Verify Serial Barcode'**
  String get message216;

  /// No description provided for @message217.
  ///
  /// In en, this message translates to:
  /// **'COD Collection Required: Rp {arg0}'**
  String message217(String arg0);

  /// No description provided for @message218.
  ///
  /// In en, this message translates to:
  /// **'Failed / Refused'**
  String get message218;

  /// No description provided for @message219.
  ///
  /// In en, this message translates to:
  /// **'Handover Done'**
  String get message219;

  /// No description provided for @message220.
  ///
  /// In en, this message translates to:
  /// **'Navigation preference could not load: {arg0}'**
  String message220(String arg0);

  /// No description provided for @message221.
  ///
  /// In en, this message translates to:
  /// **'Navigation is not available in this build.'**
  String get message221;

  /// No description provided for @message222.
  ///
  /// In en, this message translates to:
  /// **'Share only destination GPS with your chosen navigation app. Choice is remembered for one-tap navigation. Return using Maps callback or the system Back/app switcher.'**
  String get message222;

  /// No description provided for @message223.
  ///
  /// In en, this message translates to:
  /// **'Navigation could not open: {arg0}'**
  String message223(String arg0);

  /// No description provided for @message224.
  ///
  /// In en, this message translates to:
  /// **'Navigation unavailable: destination GPS missing or invalid. Ask dispatch to supply verified coordinates.'**
  String get message224;

  /// No description provided for @message225.
  ///
  /// In en, this message translates to:
  /// **'External navigation requires Android or iOS.'**
  String get message225;

  /// No description provided for @message226.
  ///
  /// In en, this message translates to:
  /// **'Opening navigation...'**
  String get message226;

  /// No description provided for @message227.
  ///
  /// In en, this message translates to:
  /// **'Choose navigation app'**
  String get message227;

  /// No description provided for @message228.
  ///
  /// In en, this message translates to:
  /// **'Clocked out successfully for today'**
  String get message228;

  /// No description provided for @message229.
  ///
  /// In en, this message translates to:
  /// **'Outside Store Geofence'**
  String get message229;

  /// No description provided for @message230.
  ///
  /// In en, this message translates to:
  /// **'Your GPS position ({arg0}) is outside the authorized store perimeter (200m). Please clock-in inside the store building.'**
  String message230(String arg0);

  /// No description provided for @message231.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get message231;

  /// No description provided for @message232.
  ///
  /// In en, this message translates to:
  /// **'GPS Verified: [{arg0}, {arg1}] (Accuracy: {arg2}m)'**
  String message232(String arg0, String arg1, String arg2);

  /// No description provided for @message233.
  ///
  /// In en, this message translates to:
  /// **'GPS Geofence Verified: Clock-in recorded (PRESENT at store)'**
  String get message233;

  /// No description provided for @message234.
  ///
  /// In en, this message translates to:
  /// **'Biometric identity confirmed (Fingerprint / Face ID verified)'**
  String get message234;

  /// No description provided for @message235.
  ///
  /// In en, this message translates to:
  /// **'Worker App'**
  String get message235;

  /// No description provided for @message236.
  ///
  /// In en, this message translates to:
  /// **'Actionable Notifications'**
  String get message236;

  /// No description provided for @message237.
  ///
  /// In en, this message translates to:
  /// **'Verify Biometrics'**
  String get message237;

  /// No description provided for @message238.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get message238;

  /// No description provided for @message239.
  ///
  /// In en, this message translates to:
  /// **'{arg0} Offline Action(s) Queued'**
  String message239(String arg0);

  /// No description provided for @message240.
  ///
  /// In en, this message translates to:
  /// **'Auto-syncing in background when connected'**
  String get message240;

  /// No description provided for @message241.
  ///
  /// In en, this message translates to:
  /// **'Sync Now'**
  String get message241;

  /// No description provided for @message242.
  ///
  /// In en, this message translates to:
  /// **'Clocked In (Present)'**
  String get message242;

  /// No description provided for @message243.
  ///
  /// In en, this message translates to:
  /// **'Daily Attendance'**
  String get message243;

  /// No description provided for @message244.
  ///
  /// In en, this message translates to:
  /// **'Verified: {arg0}'**
  String message244(String arg0);

  /// No description provided for @message245.
  ///
  /// In en, this message translates to:
  /// **'Requires GPS Geofence Check'**
  String get message245;

  /// No description provided for @message246.
  ///
  /// In en, this message translates to:
  /// **'Clock Out'**
  String get message246;

  /// No description provided for @message247.
  ///
  /// In en, this message translates to:
  /// **'Clock In'**
  String get message247;

  /// No description provided for @message248.
  ///
  /// In en, this message translates to:
  /// **'My Active Work'**
  String get message248;

  /// No description provided for @message249.
  ///
  /// In en, this message translates to:
  /// **'Credit Surveys Queue'**
  String get message249;

  /// No description provided for @message250.
  ///
  /// In en, this message translates to:
  /// **'{arg0} survey(s) • KTP/KK/GPS Photo Evidence'**
  String message250(String arg0);

  /// No description provided for @message251.
  ///
  /// In en, this message translates to:
  /// **'{arg0} PENDING'**
  String message251(String arg0);

  /// No description provided for @message252.
  ///
  /// In en, this message translates to:
  /// **'Active Delivery Trip'**
  String get message252;

  /// No description provided for @message253.
  ///
  /// In en, this message translates to:
  /// **'{arg0} • {arg1} Drops • Barcode & Signature'**
  String message253(String arg0, String arg1);

  /// No description provided for @message254.
  ///
  /// In en, this message translates to:
  /// **'Field Collection Visits'**
  String get message254;

  /// No description provided for @message255.
  ///
  /// In en, this message translates to:
  /// **'{arg0} accounts • Cash: Rp {arg1}'**
  String message255(String arg0, String arg1);

  /// No description provided for @message256.
  ///
  /// In en, this message translates to:
  /// **'{arg0} DUE'**
  String message256(String arg0);

  /// No description provided for @message257.
  ///
  /// In en, this message translates to:
  /// **'Sales & Customer Follow-Ups'**
  String get message257;

  /// No description provided for @message258.
  ///
  /// In en, this message translates to:
  /// **'Confirmed orders eligible for commission recognition'**
  String get message258;

  /// No description provided for @message259.
  ///
  /// In en, this message translates to:
  /// **'Assigned Helper Tasks'**
  String get message259;

  /// No description provided for @message260.
  ///
  /// In en, this message translates to:
  /// **'Loading delivery trip truck • Showroom prep'**
  String get message260;

  /// No description provided for @message261.
  ///
  /// In en, this message translates to:
  /// **'Personal Records & Company'**
  String get message261;

  /// No description provided for @message262.
  ///
  /// In en, this message translates to:
  /// **'GPS Geofence history'**
  String get message262;

  /// No description provided for @message263.
  ///
  /// In en, this message translates to:
  /// **'My Payroll Slips'**
  String get message263;

  /// No description provided for @message264.
  ///
  /// In en, this message translates to:
  /// **'Salary & commissions'**
  String get message264;

  /// No description provided for @message265.
  ///
  /// In en, this message translates to:
  /// **'Office Bulletin'**
  String get message265;

  /// No description provided for @message266.
  ///
  /// In en, this message translates to:
  /// **'Rules, SOPs & targets'**
  String get message266;

  /// No description provided for @message267.
  ///
  /// In en, this message translates to:
  /// **'My Task Center'**
  String get message267;

  /// No description provided for @message268.
  ///
  /// In en, this message translates to:
  /// **'All assigned tasks'**
  String get message268;

  /// No description provided for @message269.
  ///
  /// In en, this message translates to:
  /// **'Mobile Stocktake'**
  String get message269;

  /// No description provided for @message270.
  ///
  /// In en, this message translates to:
  /// **'Scan and compare book balance'**
  String get message270;

  /// No description provided for @message271.
  ///
  /// In en, this message translates to:
  /// **'Warehouse Picking'**
  String get message271;

  /// No description provided for @message272.
  ///
  /// In en, this message translates to:
  /// **'Verify manifest serials'**
  String get message272;

  /// No description provided for @message273.
  ///
  /// In en, this message translates to:
  /// **'Stocktake session returned invalid data.'**
  String get message273;

  /// No description provided for @message274.
  ///
  /// In en, this message translates to:
  /// **'Stocktake session unavailable: {arg0}'**
  String message274(String arg0);

  /// No description provided for @message275.
  ///
  /// In en, this message translates to:
  /// **'Count reviewed'**
  String get message275;

  /// No description provided for @message276.
  ///
  /// In en, this message translates to:
  /// **'Count rejected for recount'**
  String get message276;

  /// No description provided for @message277.
  ///
  /// In en, this message translates to:
  /// **'Stocktake reviewed. Inventory unchanged.'**
  String get message277;

  /// No description provided for @message278.
  ///
  /// In en, this message translates to:
  /// **'Stocktake rejected for recount.'**
  String get message278;

  /// No description provided for @message279.
  ///
  /// In en, this message translates to:
  /// **'Review failed: {arg0}'**
  String message279(String arg0);

  /// No description provided for @message280.
  ///
  /// In en, this message translates to:
  /// **'Review Stocktake'**
  String get message280;

  /// No description provided for @message281.
  ///
  /// In en, this message translates to:
  /// **'Status: {arg0} • {arg1} variance(s)'**
  String message281(String arg0, String arg1);

  /// No description provided for @message282.
  ///
  /// In en, this message translates to:
  /// **'Unknown product'**
  String get message282;

  /// No description provided for @message283.
  ///
  /// In en, this message translates to:
  /// **'Reject / Recount'**
  String get message283;

  /// No description provided for @message284.
  ///
  /// In en, this message translates to:
  /// **'Approve Review'**
  String get message284;

  /// No description provided for @message285.
  ///
  /// In en, this message translates to:
  /// **'Saved stocktake session could not be read: {arg0}'**
  String message285(String arg0);

  /// No description provided for @message286.
  ///
  /// In en, this message translates to:
  /// **'Your profile has no store assignment.'**
  String get message286;

  /// No description provided for @message287.
  ///
  /// In en, this message translates to:
  /// **'Could not load book balance: {arg0}'**
  String message287(String arg0);

  /// No description provided for @message288.
  ///
  /// In en, this message translates to:
  /// **'No server session exists. Connect and start a session before submitting.'**
  String get message288;

  /// No description provided for @message289.
  ///
  /// In en, this message translates to:
  /// **'Stocktake submission returned invalid data.'**
  String get message289;

  /// No description provided for @message290.
  ///
  /// In en, this message translates to:
  /// **'Count submitted for supervisor review. Inventory unchanged.'**
  String get message290;

  /// No description provided for @message291.
  ///
  /// In en, this message translates to:
  /// **'Count not submitted; local scans retained: {arg0}'**
  String message291(String arg0);

  /// No description provided for @message292.
  ///
  /// In en, this message translates to:
  /// **'Stocktake Scan'**
  String get message292;

  /// No description provided for @message293.
  ///
  /// In en, this message translates to:
  /// **'Scan stock unit serial. Manual entry available.'**
  String get message293;

  /// No description provided for @message294.
  ///
  /// In en, this message translates to:
  /// **'Duplicate scan ignored: {arg0}'**
  String message294(String arg0);

  /// No description provided for @message295.
  ///
  /// In en, this message translates to:
  /// **'Scan Unit'**
  String get message295;

  /// No description provided for @message296.
  ///
  /// In en, this message translates to:
  /// **'Blind count'**
  String get message296;

  /// No description provided for @message297.
  ///
  /// In en, this message translates to:
  /// **'{arg0} scanned • {arg1}'**
  String message297(String arg0, String arg1);

  /// No description provided for @message298.
  ///
  /// In en, this message translates to:
  /// **'Expected inventory stays hidden. Scans save on this device while offline. Submissions go to supervisor review and never adjust inventory.'**
  String get message298;

  /// No description provided for @message299.
  ///
  /// In en, this message translates to:
  /// **'Submit for supervisor review'**
  String get message299;

  /// No description provided for @message300.
  ///
  /// In en, this message translates to:
  /// **'Start new session'**
  String get message300;

  /// No description provided for @message301.
  ///
  /// In en, this message translates to:
  /// **'Scanned serials ({arg0})'**
  String message301(String arg0);

  /// No description provided for @message302.
  ///
  /// In en, this message translates to:
  /// **'Picking manifest returned invalid data.'**
  String get message302;

  /// No description provided for @message303.
  ///
  /// In en, this message translates to:
  /// **'Picking manifest unavailable: {arg0}'**
  String message303(String arg0);

  /// No description provided for @message304.
  ///
  /// In en, this message translates to:
  /// **'No stock-unit serials assigned to {arg0}.'**
  String message304(String arg0);

  /// No description provided for @message305.
  ///
  /// In en, this message translates to:
  /// **'Verify Packing Manifest'**
  String get message305;

  /// No description provided for @message306.
  ///
  /// In en, this message translates to:
  /// **'Scan {arg0} stock-unit serial(s) for {arg1}'**
  String message306(String arg0, String arg1);

  /// No description provided for @message307.
  ///
  /// In en, this message translates to:
  /// **'Unexpected serial for {arg0}: {arg1}'**
  String message307(String arg0, String arg1);

  /// No description provided for @message308.
  ///
  /// In en, this message translates to:
  /// **'Server did not confirm packing verification.'**
  String get message308;

  /// No description provided for @message309.
  ///
  /// In en, this message translates to:
  /// **'{arg0} packing verified.'**
  String message309(String arg0);

  /// No description provided for @message310.
  ///
  /// In en, this message translates to:
  /// **'Packing verification failed: {arg0}'**
  String message310(String arg0);

  /// No description provided for @message311.
  ///
  /// In en, this message translates to:
  /// **'Guided Picking & Packing'**
  String get message311;

  /// No description provided for @message312.
  ///
  /// In en, this message translates to:
  /// **'Refresh manifests'**
  String get message312;

  /// No description provided for @message313.
  ///
  /// In en, this message translates to:
  /// **'{arg0} / {arg1} manifests verified'**
  String message313(String arg0, String arg1);

  /// No description provided for @message314.
  ///
  /// In en, this message translates to:
  /// **'No pending delivery manifests.'**
  String get message314;

  /// No description provided for @message315.
  ///
  /// In en, this message translates to:
  /// **'Product manifest'**
  String get message315;

  /// No description provided for @message316.
  ///
  /// In en, this message translates to:
  /// **'Customer: {arg0}'**
  String message316(String arg0);

  /// No description provided for @message317.
  ///
  /// In en, this message translates to:
  /// **'Expected units: {arg0}'**
  String message317(String arg0);

  /// No description provided for @message318.
  ///
  /// In en, this message translates to:
  /// **'Manifest verified'**
  String get message318;

  /// No description provided for @message319.
  ///
  /// In en, this message translates to:
  /// **'{arg0} / {arg1} scanned'**
  String message319(String arg0, String arg1);

  /// No description provided for @message320.
  ///
  /// In en, this message translates to:
  /// **'Scan'**
  String get message320;

  /// No description provided for @message321.
  ///
  /// In en, this message translates to:
  /// **'Notifications returned invalid data.'**
  String get message321;

  /// No description provided for @message322.
  ///
  /// In en, this message translates to:
  /// **'Notifications unavailable: {arg0}'**
  String message322(String arg0);

  /// No description provided for @message323.
  ///
  /// In en, this message translates to:
  /// **'Could not mark notification read: {arg0}'**
  String message323(String arg0);

  /// No description provided for @message324.
  ///
  /// In en, this message translates to:
  /// **'Approval steps returned invalid data.'**
  String get message324;

  /// No description provided for @message325.
  ///
  /// In en, this message translates to:
  /// **'No pending approval step found.'**
  String get message325;

  /// No description provided for @message326.
  ///
  /// In en, this message translates to:
  /// **'Decided from mobile notification'**
  String get message326;

  /// No description provided for @message327.
  ///
  /// In en, this message translates to:
  /// **'Approval recorded.'**
  String get message327;

  /// No description provided for @message328.
  ///
  /// In en, this message translates to:
  /// **'Rejection recorded.'**
  String get message328;

  /// No description provided for @message329.
  ///
  /// In en, this message translates to:
  /// **'Approval action failed: {arg0}'**
  String message329(String arg0);

  /// No description provided for @message330.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get message330;

  /// No description provided for @message331.
  ///
  /// In en, this message translates to:
  /// **'No notifications.'**
  String get message331;

  /// No description provided for @message332.
  ///
  /// In en, this message translates to:
  /// **'Open document'**
  String get message332;

  /// No description provided for @message333.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get message333;

  /// No description provided for @message334.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get message334;

  /// No description provided for @message335.
  ///
  /// In en, this message translates to:
  /// **'My Payroll & Compensation'**
  String get message335;

  /// No description provided for @message336.
  ///
  /// In en, this message translates to:
  /// **'No payroll slips available yet.'**
  String get message336;

  /// No description provided for @message337.
  ///
  /// In en, this message translates to:
  /// **'Cutoff: {arg0} • Payout: {arg1}'**
  String message337(String arg0, String arg1);

  /// No description provided for @message338.
  ///
  /// In en, this message translates to:
  /// **'Total Net Payout (Transfer)'**
  String get message338;

  /// No description provided for @message339.
  ///
  /// In en, this message translates to:
  /// **'Disbursed via BCA Payroll Account'**
  String get message339;

  /// No description provided for @message340.
  ///
  /// In en, this message translates to:
  /// **'Earnings & Commission Breakdown'**
  String get message340;

  /// No description provided for @message341.
  ///
  /// In en, this message translates to:
  /// **'Base Salary (Prorated)'**
  String get message341;

  /// No description provided for @message342.
  ///
  /// In en, this message translates to:
  /// **'Confirmed Sales Commission'**
  String get message342;

  /// No description provided for @message343.
  ///
  /// In en, this message translates to:
  /// **'Collection Recovery Incentive'**
  String get message343;

  /// No description provided for @message344.
  ///
  /// In en, this message translates to:
  /// **'Operational & Fuel Allowance'**
  String get message344;

  /// No description provided for @message345.
  ///
  /// In en, this message translates to:
  /// **'Gross Earnings'**
  String get message345;

  /// No description provided for @message346.
  ///
  /// In en, this message translates to:
  /// **'Deductions & Adjustments'**
  String get message346;

  /// No description provided for @message347.
  ///
  /// In en, this message translates to:
  /// **'Attendance & Late Deductions'**
  String get message347;

  /// No description provided for @message348.
  ///
  /// In en, this message translates to:
  /// **'Total Deductions'**
  String get message348;

  /// No description provided for @message349.
  ///
  /// In en, this message translates to:
  /// **'Catalog Product'**
  String get message349;

  /// No description provided for @message350.
  ///
  /// In en, this message translates to:
  /// **'Product Simulation'**
  String get message350;

  /// No description provided for @message351.
  ///
  /// In en, this message translates to:
  /// **'Catalog search failed: {arg0}'**
  String message351(String arg0);

  /// No description provided for @message352.
  ///
  /// In en, this message translates to:
  /// **'Credit simulation copied! Ready to send to WhatsApp/buyer.'**
  String get message352;

  /// No description provided for @message353.
  ///
  /// In en, this message translates to:
  /// **'Credit Calculator & Simulation'**
  String get message353;

  /// No description provided for @message354.
  ///
  /// In en, this message translates to:
  /// **'Copy Quote (WhatsApp)'**
  String get message354;

  /// No description provided for @message355.
  ///
  /// In en, this message translates to:
  /// **'Reset Input'**
  String get message355;

  /// No description provided for @message356.
  ///
  /// In en, this message translates to:
  /// **'Simulate credit installments for buyer-specific terms (10% down payment, custom amount, or flexible term).'**
  String get message356;

  /// No description provided for @message357.
  ///
  /// In en, this message translates to:
  /// **'Product Source'**
  String get message357;

  /// No description provided for @message358.
  ///
  /// In en, this message translates to:
  /// **'Manual Input'**
  String get message358;

  /// No description provided for @message359.
  ///
  /// In en, this message translates to:
  /// **'Store Catalog'**
  String get message359;

  /// No description provided for @message360.
  ///
  /// In en, this message translates to:
  /// **'Code: {arg0}'**
  String message360(String arg0);

  /// No description provided for @message361.
  ///
  /// In en, this message translates to:
  /// **'Search product name / code...'**
  String get message361;

  /// No description provided for @message362.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get message362;

  /// No description provided for @message363.
  ///
  /// In en, this message translates to:
  /// **'Product / Package Name (Optional)'**
  String get message363;

  /// No description provided for @message364.
  ///
  /// In en, this message translates to:
  /// **'Example: Smart TV 43\" UHD / L Sofa Package'**
  String get message364;

  /// No description provided for @message365.
  ///
  /// In en, this message translates to:
  /// **'Base Price (HD / Cash OTR)'**
  String get message365;

  /// No description provided for @message366.
  ///
  /// In en, this message translates to:
  /// **'Base Price Amount'**
  String get message366;

  /// No description provided for @message367.
  ///
  /// In en, this message translates to:
  /// **'+500 K'**
  String get message367;

  /// No description provided for @message368.
  ///
  /// In en, this message translates to:
  /// **'+1 M'**
  String get message368;

  /// No description provided for @message369.
  ///
  /// In en, this message translates to:
  /// **'+2 M'**
  String get message369;

  /// No description provided for @message370.
  ///
  /// In en, this message translates to:
  /// **'+5 M'**
  String get message370;

  /// No description provided for @message371.
  ///
  /// In en, this message translates to:
  /// **'Down Payment (DP)'**
  String get message371;

  /// No description provided for @message372.
  ///
  /// In en, this message translates to:
  /// **'Standard'**
  String get message372;

  /// No description provided for @message373.
  ///
  /// In en, this message translates to:
  /// **'Percentage (%)'**
  String get message373;

  /// No description provided for @message374.
  ///
  /// In en, this message translates to:
  /// **'Amount (Rp)'**
  String get message374;

  /// No description provided for @message375.
  ///
  /// In en, this message translates to:
  /// **'System recommendation: {arg0} ({arg1})'**
  String message375(String arg0, String arg1);

  /// No description provided for @message376.
  ///
  /// In en, this message translates to:
  /// **'Choose Down Payment Percentage: {arg0}% = {arg1}'**
  String message376(String arg0, String arg1);

  /// No description provided for @message377.
  ///
  /// In en, this message translates to:
  /// **'Down payment amount agreed with buyer'**
  String get message377;

  /// No description provided for @message378.
  ///
  /// In en, this message translates to:
  /// **'Example: 750000'**
  String get message378;

  /// No description provided for @message379.
  ///
  /// In en, this message translates to:
  /// **'Equivalent to {arg0}% of Base Price'**
  String message379(String arg0);

  /// No description provided for @message380.
  ///
  /// In en, this message translates to:
  /// **'Net Financing Principal (h1):'**
  String get message380;

  /// No description provided for @message381.
  ///
  /// In en, this message translates to:
  /// **'{arg0} (incl. Rp 30K fee)'**
  String message381(String arg0);

  /// No description provided for @message382.
  ///
  /// In en, this message translates to:
  /// **'15% Timely Payment Discount'**
  String get message382;

  /// No description provided for @message383.
  ///
  /// In en, this message translates to:
  /// **'Term & Installment Options'**
  String get message383;

  /// No description provided for @message384.
  ///
  /// In en, this message translates to:
  /// **'{arg0} Options Available'**
  String message384(String arg0);

  /// No description provided for @message385.
  ///
  /// In en, this message translates to:
  /// **'{arg0} Months'**
  String message385(String arg0);

  /// No description provided for @message386.
  ///
  /// In en, this message translates to:
  /// **'Total Payment: {arg0}'**
  String message386(String arg0);

  /// No description provided for @message387.
  ///
  /// In en, this message translates to:
  /// **'Save Rp {arg0}K/month (15% Discount)'**
  String message387(String arg0);

  /// No description provided for @message388.
  ///
  /// In en, this message translates to:
  /// **'Retail Formula Details (Company Standard)'**
  String get message388;

  /// No description provided for @message389.
  ///
  /// In en, this message translates to:
  /// **'Calculation breakdown for a {arg0}-month term'**
  String message389(String arg0);

  /// No description provided for @message390.
  ///
  /// In en, this message translates to:
  /// **'1. Net Principal (h1)'**
  String get message390;

  /// No description provided for @message391.
  ///
  /// In en, this message translates to:
  /// **'2. Flat Interest (h2)'**
  String get message391;

  /// No description provided for @message392.
  ///
  /// In en, this message translates to:
  /// **'h1 × (1 + 4% × {arg0} months)'**
  String message392(String arg0);

  /// No description provided for @message393.
  ///
  /// In en, this message translates to:
  /// **'3. Gross Installment (h3)'**
  String get message393;

  /// No description provided for @message394.
  ///
  /// In en, this message translates to:
  /// **'{arg0}/month'**
  String message394(String arg0);

  /// No description provided for @message395.
  ///
  /// In en, this message translates to:
  /// **'4. Timely Payment Discount (h4)'**
  String get message395;

  /// No description provided for @message396.
  ///
  /// In en, this message translates to:
  /// **'h3 × 85% (15% Discount)'**
  String get message396;

  /// No description provided for @message397.
  ///
  /// In en, this message translates to:
  /// **'5. Final Result'**
  String get message397;

  /// No description provided for @message398.
  ///
  /// In en, this message translates to:
  /// **'Copy Simulation for WhatsApp'**
  String get message398;

  /// No description provided for @message399.
  ///
  /// In en, this message translates to:
  /// **'Use {arg0}-Month Term ({arg1}/month)'**
  String message399(String arg0, String arg1);

  /// No description provided for @message400.
  ///
  /// In en, this message translates to:
  /// **'Sales order returned invalid data.'**
  String get message400;

  /// No description provided for @message401.
  ///
  /// In en, this message translates to:
  /// **'Sales order unavailable: {arg0}'**
  String message401(String arg0);

  /// No description provided for @message402.
  ///
  /// In en, this message translates to:
  /// **'Sales Order'**
  String get message402;

  /// No description provided for @message403.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get message403;

  /// No description provided for @message404.
  ///
  /// In en, this message translates to:
  /// **'Status: {arg0}'**
  String message404(String arg0);

  /// No description provided for @message405.
  ///
  /// In en, this message translates to:
  /// **'Item'**
  String get message405;

  /// No description provided for @message406.
  ///
  /// In en, this message translates to:
  /// **'Quantity: {arg0}'**
  String message406(String arg0);

  /// No description provided for @message407.
  ///
  /// In en, this message translates to:
  /// **'Quote total'**
  String get message407;

  /// No description provided for @message408.
  ///
  /// In en, this message translates to:
  /// **'Sales progress unavailable. Check access or connection.'**
  String get message408;

  /// No description provided for @message409.
  ///
  /// In en, this message translates to:
  /// **'Enter customer name or phone to search.'**
  String get message409;

  /// No description provided for @message410.
  ///
  /// In en, this message translates to:
  /// **'Customer search returned invalid data.'**
  String get message410;

  /// No description provided for @message411.
  ///
  /// In en, this message translates to:
  /// **'Customer search failed: {arg0}'**
  String message411(String arg0);

  /// No description provided for @message412.
  ///
  /// In en, this message translates to:
  /// **'Draft quotation could not be created: {arg0}'**
  String message412(String arg0);

  /// No description provided for @message413.
  ///
  /// In en, this message translates to:
  /// **'Enter product name or code to search.'**
  String get message413;

  /// No description provided for @message414.
  ///
  /// In en, this message translates to:
  /// **'Product search returned invalid data.'**
  String get message414;

  /// No description provided for @message415.
  ///
  /// In en, this message translates to:
  /// **'Product search failed: {arg0}'**
  String message415(String arg0);

  /// No description provided for @message416.
  ///
  /// In en, this message translates to:
  /// **'No active product variants found.'**
  String get message416;

  /// No description provided for @message417.
  ///
  /// In en, this message translates to:
  /// **'No active store price for this product.'**
  String get message417;

  /// No description provided for @message418.
  ///
  /// In en, this message translates to:
  /// **'Quote items returned invalid data.'**
  String get message418;

  /// No description provided for @message419.
  ///
  /// In en, this message translates to:
  /// **'{arg0} added to draft quote.'**
  String message419(String arg0);

  /// No description provided for @message420.
  ///
  /// In en, this message translates to:
  /// **'Could not add product to quote: {arg0}'**
  String message420(String arg0);

  /// No description provided for @message421.
  ///
  /// In en, this message translates to:
  /// **'Simulation: {arg0} ({arg1} months @ {arg2}/month)'**
  String message421(String arg0, String arg1, String arg2);

  /// No description provided for @message422.
  ///
  /// In en, this message translates to:
  /// **'Simulation {arg0}: {arg1} months @ {arg2}/month'**
  String message422(String arg0, String arg1, String arg2);

  /// No description provided for @message423.
  ///
  /// In en, this message translates to:
  /// **'Salesperson Work Center'**
  String get message423;

  /// No description provided for @message424.
  ///
  /// In en, this message translates to:
  /// **'Sales progress unavailable'**
  String get message424;

  /// No description provided for @message425.
  ///
  /// In en, this message translates to:
  /// **'{arg0} confirmed orders this month'**
  String message425(String arg0);

  /// No description provided for @message426.
  ///
  /// In en, this message translates to:
  /// **'Refresh progress'**
  String get message426;

  /// No description provided for @message427.
  ///
  /// In en, this message translates to:
  /// **'Actual: {arg0} / Target: {arg1} ({arg2}%)'**
  String message427(String arg0, String arg1, String arg2);

  /// No description provided for @message428.
  ///
  /// In en, this message translates to:
  /// **'Estimated Commission: {arg0}'**
  String message428(String arg0);

  /// No description provided for @message429.
  ///
  /// In en, this message translates to:
  /// **'Credit Calculator & Simulation'**
  String get message429;

  /// No description provided for @message430.
  ///
  /// In en, this message translates to:
  /// **'Simulate installments with custom down payment (10%, custom amount, or custom term).'**
  String get message430;

  /// No description provided for @message431.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get message431;

  /// No description provided for @message432.
  ///
  /// In en, this message translates to:
  /// **'Find customer'**
  String get message432;

  /// No description provided for @message433.
  ///
  /// In en, this message translates to:
  /// **'Quote draft: {arg0}'**
  String message433(String arg0);

  /// No description provided for @message434.
  ///
  /// In en, this message translates to:
  /// **'Customer name or phone'**
  String get message434;

  /// No description provided for @message435.
  ///
  /// In en, this message translates to:
  /// **'Search Customers'**
  String get message435;

  /// No description provided for @message436.
  ///
  /// In en, this message translates to:
  /// **'Create draft quotation'**
  String get message436;

  /// No description provided for @message437.
  ///
  /// In en, this message translates to:
  /// **'Product name or code'**
  String get message437;

  /// No description provided for @message438.
  ///
  /// In en, this message translates to:
  /// **'Search Products'**
  String get message438;

  /// No description provided for @message439.
  ///
  /// In en, this message translates to:
  /// **'Simulate credit for this product'**
  String get message439;

  /// No description provided for @message440.
  ///
  /// In en, this message translates to:
  /// **'Add one unit at store cash price'**
  String get message440;

  /// No description provided for @message441.
  ///
  /// In en, this message translates to:
  /// **'Customer Location Survey'**
  String get message441;

  /// No description provided for @message442.
  ///
  /// In en, this message translates to:
  /// **'Could not capture GPS location: {arg0}'**
  String message442(String arg0);

  /// No description provided for @message443.
  ///
  /// In en, this message translates to:
  /// **'Confirm {arg0} Survey?'**
  String message443(String arg0);

  /// No description provided for @message444.
  ///
  /// In en, this message translates to:
  /// **'This will approve customer credit eligibility and advance the sales order to confirmation.'**
  String get message444;

  /// No description provided for @message445.
  ///
  /// In en, this message translates to:
  /// **'This will reject credit eligibility and set the sales order to terminal SURVEY_REJECTED.'**
  String get message445;

  /// No description provided for @message446.
  ///
  /// In en, this message translates to:
  /// **'Confirm Approval'**
  String get message446;

  /// No description provided for @message447.
  ///
  /// In en, this message translates to:
  /// **'Confirm Rejection'**
  String get message447;

  /// No description provided for @message448.
  ///
  /// In en, this message translates to:
  /// **'Survey decision not submitted; GPS unavailable: {arg0}'**
  String message448(String arg0);

  /// No description provided for @message449.
  ///
  /// In en, this message translates to:
  /// **'Survey profile was not saved. Check connection and retry.'**
  String get message449;

  /// No description provided for @message450.
  ///
  /// In en, this message translates to:
  /// **'Credit survey decision recorded: {arg0} with GPS & {arg1} photos'**
  String message450(String arg0, String arg1);

  /// No description provided for @message451.
  ///
  /// In en, this message translates to:
  /// **'Failed to submit survey decision'**
  String get message451;

  /// No description provided for @message452.
  ///
  /// In en, this message translates to:
  /// **'Credit Survey Assessment'**
  String get message452;

  /// No description provided for @message453.
  ///
  /// In en, this message translates to:
  /// **'Survey ID: {arg0}'**
  String message453(String arg0);

  /// No description provided for @message454.
  ///
  /// In en, this message translates to:
  /// **'NIK: 3171021405880003  •  Phone: 0812-8899-7711'**
  String get message454;

  /// No description provided for @message455.
  ///
  /// In en, this message translates to:
  /// **'Address: Jl. Tebet Barat Dalam VII No. 4, Jakarta Selatan'**
  String get message455;

  /// No description provided for @message456.
  ///
  /// In en, this message translates to:
  /// **'Delivery Location Profile'**
  String get message456;

  /// No description provided for @message457.
  ///
  /// In en, this message translates to:
  /// **'Destination GPS not captured'**
  String get message457;

  /// No description provided for @message458.
  ///
  /// In en, this message translates to:
  /// **'GPS: {arg0}, {arg1} (±{arg2} m)'**
  String message458(String arg0, String arg1, String arg2);

  /// No description provided for @message459.
  ///
  /// In en, this message translates to:
  /// **'Capture destination GPS'**
  String get message459;

  /// No description provided for @message460.
  ///
  /// In en, this message translates to:
  /// **'Alley width (meters)'**
  String get message460;

  /// No description provided for @message461.
  ///
  /// In en, this message translates to:
  /// **'Stair / doorway clearance (meters)'**
  String get message461;

  /// No description provided for @message462.
  ///
  /// In en, this message translates to:
  /// **'Gate and delivery access notes'**
  String get message462;

  /// No description provided for @message463.
  ///
  /// In en, this message translates to:
  /// **'Gate width, access hours, stairs, parking constraints'**
  String get message463;

  /// No description provided for @message464.
  ///
  /// In en, this message translates to:
  /// **'Residence & Financial Verification'**
  String get message464;

  /// No description provided for @message465.
  ///
  /// In en, this message translates to:
  /// **'Home Ownership Status'**
  String get message465;

  /// No description provided for @message466.
  ///
  /// In en, this message translates to:
  /// **'Self-owned'**
  String get message466;

  /// No description provided for @message467.
  ///
  /// In en, this message translates to:
  /// **'Family-owned'**
  String get message467;

  /// No description provided for @message468.
  ///
  /// In en, this message translates to:
  /// **'Annual Rental (Contract)'**
  String get message468;

  /// No description provided for @message469.
  ///
  /// In en, this message translates to:
  /// **'Boarding / Monthly Rental'**
  String get message469;

  /// No description provided for @message470.
  ///
  /// In en, this message translates to:
  /// **'Estimated Net Monthly Income (Rp)'**
  String get message470;

  /// No description provided for @message471.
  ///
  /// In en, this message translates to:
  /// **'Estimated Monthly Living Expenses (Rp)'**
  String get message471;

  /// No description provided for @message472.
  ///
  /// In en, this message translates to:
  /// **'Other Existing Installments / Obligations'**
  String get message472;

  /// No description provided for @message473.
  ///
  /// In en, this message translates to:
  /// **'Customer ID Card (KTP)'**
  String get message473;

  /// No description provided for @message474.
  ///
  /// In en, this message translates to:
  /// **'Family Card (KK)'**
  String get message474;

  /// No description provided for @message475.
  ///
  /// In en, this message translates to:
  /// **'Electricity / Water Proof'**
  String get message475;

  /// No description provided for @message476.
  ///
  /// In en, this message translates to:
  /// **'House & Front Door'**
  String get message476;

  /// No description provided for @message477.
  ///
  /// In en, this message translates to:
  /// **'Field Physical Document Checks'**
  String get message477;

  /// No description provided for @message478.
  ///
  /// In en, this message translates to:
  /// **'Original KTP Verified on site'**
  String get message478;

  /// No description provided for @message479.
  ///
  /// In en, this message translates to:
  /// **'Family Card (KK) verified'**
  String get message479;

  /// No description provided for @message480.
  ///
  /// In en, this message translates to:
  /// **'Recent Electricity / Water Utility Bill matches address'**
  String get message480;

  /// No description provided for @message481.
  ///
  /// In en, this message translates to:
  /// **'Proof of Income / Payslip / Bank Statement'**
  String get message481;

  /// No description provided for @message482.
  ///
  /// In en, this message translates to:
  /// **'Surveyor Assessment & Justification'**
  String get message482;

  /// No description provided for @message483.
  ///
  /// In en, this message translates to:
  /// **'Assessment Notes'**
  String get message483;

  /// No description provided for @message484.
  ///
  /// In en, this message translates to:
  /// **'Provide detailed justification for credit viability...'**
  String get message484;

  /// No description provided for @message485.
  ///
  /// In en, this message translates to:
  /// **'Reject Credit'**
  String get message485;

  /// No description provided for @message486.
  ///
  /// In en, this message translates to:
  /// **'Approve Credit'**
  String get message486;

  /// No description provided for @message487.
  ///
  /// In en, this message translates to:
  /// **'Credit Survey: Customer #{arg0}'**
  String message487(String arg0);

  /// No description provided for @message488.
  ///
  /// In en, this message translates to:
  /// **'Delivery: {arg0} ({arg1})'**
  String message488(String arg0, String arg1);

  /// No description provided for @message489.
  ///
  /// In en, this message translates to:
  /// **'Field Collection: {arg0}'**
  String message489(String arg0);

  /// No description provided for @message490.
  ///
  /// In en, this message translates to:
  /// **'Warehouse Truck Prep & Helper Inspection'**
  String get message490;

  /// No description provided for @message491.
  ///
  /// In en, this message translates to:
  /// **'My Work & Task Queue'**
  String get message491;

  /// No description provided for @message492.
  ///
  /// In en, this message translates to:
  /// **'All Tasks'**
  String get message492;

  /// No description provided for @message493.
  ///
  /// In en, this message translates to:
  /// **'Deliveries'**
  String get message493;

  /// No description provided for @message494.
  ///
  /// In en, this message translates to:
  /// **'Surveys'**
  String get message494;

  /// No description provided for @message495.
  ///
  /// In en, this message translates to:
  /// **'Collections'**
  String get message495;

  /// No description provided for @message496.
  ///
  /// In en, this message translates to:
  /// **'Helper / Floor'**
  String get message496;

  /// No description provided for @message497.
  ///
  /// In en, this message translates to:
  /// **'No operational tasks for this filter.'**
  String get message497;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'id'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'id':
      return AppLocalizationsId();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
