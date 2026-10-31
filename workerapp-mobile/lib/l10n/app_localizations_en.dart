// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get perMonth => '/ month';

  @override
  String get morning => 'Morning';

  @override
  String get goods => 'Goods';

  @override
  String get none => 'None';

  @override
  String get notification => 'Notification';

  @override
  String get open => 'Open';

  @override
  String get submitted => 'Submitted';

  @override
  String get recount => 'Recount Required';

  @override
  String get matched => 'Matched';

  @override
  String get uncounted => 'Uncounted';

  @override
  String get missing => 'Missing';

  @override
  String get unexpected => 'Unexpected';

  @override
  String get kept => 'Kept';

  @override
  String get broken => 'Broken';

  @override
  String get inTransit => 'In Transit';

  @override
  String get unknown => 'Unknown';

  @override
  String get recipient => 'Recipient';

  @override
  String get compensation => 'Compensation';

  @override
  String get logistics => 'Logistics';

  @override
  String get finance => 'Finance';

  @override
  String get worker => 'Worker';

  @override
  String get supervisor => 'Supervisor';

  @override
  String get annual => 'Annual Leave';

  @override
  String get sick => 'Sick Leave';

  @override
  String get maternity => 'Maternity / Paternity';

  @override
  String get other => 'Other';

  @override
  String get incomeDefault => 'Eligible for 12 months installment credit.';

  @override
  String get morningWindow => 'Morning (09:00–12:00 WIB)';

  @override
  String get afternoonWindow => 'Afternoon (12:00–17:00 WIB)';

  @override
  String deliveryWindowValue(String window) {
    return 'Delivery window: $window';
  }

  @override
  String get noNotes => 'No notes';

  @override
  String get notAssigned => 'Not assigned';

  @override
  String get productItem => 'Product Item';

  @override
  String get noSession => 'NO SESSION';

  @override
  String get noDp => 'No down payment for HD < Rp 5M';

  @override
  String get priceBracket => 'Based on price bracket';

  @override
  String get taskLabel => 'TASK';

  @override
  String get formulaPrincipal => '(HD - DP) + Rp 30,000';

  @override
  String get formulaRounding => 'Round(h4 / 5,000) × 5,000 + 5,000';

  @override
  String get removePhoto => 'Remove photo';

  @override
  String capturePhoto(String category) {
    return 'Capture $category photo';
  }

  @override
  String get signatureCanvas => 'Signature drawing area';

  @override
  String get navigationPreferenceInvalid =>
      'Saved navigation app is invalid. Choose a navigation app again.';

  @override
  String get navigationGpsInvalid =>
      'Destination GPS is invalid. Ask dispatch to correct this stop.';

  @override
  String navigationUnsupported(String app) {
    return '$app is not supported on this platform.';
  }

  @override
  String get navigationStopRequired => 'Trip and delivery stop are required.';

  @override
  String navigationAppUnavailable(String app) {
    return '$app is unavailable. Install it or choose another navigation app.';
  }

  @override
  String navigationOpenFailed(String app) {
    return '$app could not open. Please retry.';
  }

  @override
  String get navigationPreferenceSaveFailed =>
      'Navigation opened, but app preference could not be saved.';

  @override
  String get gpsEnable => 'Enable device location services and try again.';

  @override
  String get gpsDenied => 'Location permission was denied.';

  @override
  String get gpsBlocked =>
      'Location permission is blocked. Enable it in system settings.';

  @override
  String get requestFailed =>
      'The operation could not be completed. Check your connection and retry.';

  @override
  String get deliverySignIn => 'Sign in to load your delivery trips.';

  @override
  String get deliveryNotAssigned =>
      'Requested trip is not assigned to this driver.';

  @override
  String get deliveryTripInvalid => 'Invalid delivery trip response.';

  @override
  String get deliveryStopInvalid => 'Invalid delivery stop response.';

  @override
  String get deliveryTripsFailed =>
      'Delivery trips could not load. Check access or connection.';

  @override
  String get deliveryStopsFailed =>
      'Delivery stops could not load. Check access or connection.';

  @override
  String get showPassword => 'Show password';

  @override
  String get hidePassword => 'Hide password';

  @override
  String photoCaptured(String count, String total) {
    return '$count / $total Captured';
  }

  @override
  String photoProofTitle(String category) {
    return '$category Proof';
  }

  @override
  String get navigate => 'Navigate';

  @override
  String navigateWithApp(String app) {
    return 'Navigate - $app';
  }

  @override
  String get present => 'Present';

  @override
  String get late => 'Late';

  @override
  String get onLeave => 'On Leave';

  @override
  String get halfDay => 'Half Day';

  @override
  String get absent => 'Absent';

  @override
  String get pending => 'Pending';

  @override
  String get approved => 'Approved';

  @override
  String get rejected => 'Rejected';

  @override
  String get completed => 'Completed';

  @override
  String get planned => 'Planned';

  @override
  String get dispatched => 'Dispatched';

  @override
  String get delivered => 'Delivered';

  @override
  String get failed => 'Failed';

  @override
  String get assigned => 'Assigned';

  @override
  String get paid => 'Paid';

  @override
  String get unpaid => 'Unpaid';

  @override
  String get inProgress => 'In Progress';

  @override
  String get draft => 'Draft';

  @override
  String get confirmed => 'Confirmed';

  @override
  String get surveyRejected => 'Survey Rejected';

  @override
  String get handedOver => 'Handed Over';

  @override
  String get cashVerified => 'Cash Verified';

  @override
  String get vipCash => 'VIP Cash';

  @override
  String get starCredit => 'Star Credit';

  @override
  String get highRisk => 'High Delinquency Risk';

  @override
  String get general => 'General';

  @override
  String get notificationPause => 'Manual resume required';

  @override
  String get trackingTitle => 'SMS Field Telematics Active';

  @override
  String get trackingBounded => 'Tracking bounded to assigned operational task';

  @override
  String get trackingNotStarted => 'Task not started';

  @override
  String get trackingComplete => 'Task completed';

  @override
  String get trackingBreak => 'Scheduled break';

  @override
  String get trackingManual => 'Tracking paused';

  @override
  String get trackingThermal => 'Thermal safety cutoff';

  @override
  String get trackingLowBattery => 'Low battery; reduced GPS frequency';

  @override
  String get trackingActive => 'GPS tracking active';

  @override
  String get trackingSystemPause =>
      'Quick pause via system notification action';

  @override
  String get trackingLunch => 'Lunch break automatic pause';

  @override
  String get trackingResume => 'Manual resume by employee';

  @override
  String get simulationTitle => '📋 *SMS STORE CREDIT SIMULATION*';

  @override
  String simulationProduct(String product) {
    return 'Product: *$product*';
  }

  @override
  String simulationPrice(String price) {
    return 'Base Price: *$price*';
  }

  @override
  String simulationDp(String amount, String percentage) {
    return 'Down Payment (DP): *$amount* ($percentage%)';
  }

  @override
  String get simulationOptions => 'MONTHLY INSTALLMENT OPTIONS:';

  @override
  String simulationTerm(String months, String amount) {
    return '• *$months Months*: $amount / month';
  }

  @override
  String simulationTotal(String total, String saved) {
    return '   (Total: $total, Discount Savings: $saved/month)';
  }

  @override
  String get simulationDiscount =>
      '💡 *15% timely payment incentive discount is included in installments.*';

  @override
  String get language => 'Language';

  @override
  String get appTitle => 'SMS Worker Portal';

  @override
  String get languagePersistenceFailed =>
      'Language preference could not be loaded or saved. Choose ID/EN to retry.';

  @override
  String get message1 => 'Manual Tracking Pause';

  @override
  String get message2 =>
      'Enter exceptional reason for pausing GPS tracking (e.g. vehicle repair, flat tire, emergency):';

  @override
  String get message3 => 'Pause Reason';

  @override
  String get message4 => 'e.g. Flat tire, changing tire';

  @override
  String get message5 => 'Cancel';

  @override
  String get message6 => 'Pause Tracking';

  @override
  String get message7 => '🎯 Proximity Alert';

  @override
  String message8(String arg0) {
    return '${arg0}m away';
  }

  @override
  String get message9 => 'Dismiss';

  @override
  String get message10 =>
      'GPS Tracking Standby • Activates strictly upon task initiation';

  @override
  String get message11 => 'Operational Task & GPS Tracking Completed';

  @override
  String message12(String arg0) {
    return 'Thermal Cutoff Active ($arg0°C > 45°C)';
  }

  @override
  String get message13 =>
      'Continuous GPS pinging suspended to prevent device battery overheating under direct sunlight. Auto-resumes when cooled <=40°C.';

  @override
  String get message14 => 'GPS Paused — Scheduled Break Enforced';

  @override
  String get message15 =>
      'Zero coordinates collected during break window (UU PDP No. 27/2022).';

  @override
  String message16(String arg0) {
    return 'Tracking Paused: $arg0';
  }

  @override
  String get message17 => 'Resume';

  @override
  String get message18 => 'GPS Tracking Active';

  @override
  String message19(String arg0, String arg1) {
    return 'Task bounded • Low Battery ($arg0%) • $arg1°C • Throttled 60s';
  }

  @override
  String message20(String arg0, String arg1, String arg2) {
    return 'Task bounded • $arg0 km/h • $arg1°C • $arg2 pings';
  }

  @override
  String get message21 => 'Quick Pause';

  @override
  String get message22 => 'Reason...';

  @override
  String message23(String arg0) {
    return 'Notification Tray: $arg0';
  }

  @override
  String get message24 => 'DISMISS ALERT';

  @override
  String get message25 => 'NOTIF PAUSE';

  @override
  String get message26 => 'NOTIF RESUME';

  @override
  String get message27 => 'Scan Barcode / QR Code';

  @override
  String get message28 => 'Align serial number barcode or QR within frame';

  @override
  String message29(String arg0) {
    return 'Camera unavailable: $arg0';
  }

  @override
  String message30(String arg0) {
    return 'Could not toggle flashlight: $arg0';
  }

  @override
  String get message31 => 'Toggle flashlight';

  @override
  String get message32 => 'Enter code manually';

  @override
  String get message33 => 'Enter';

  @override
  String get message34 => 'Field Photo Evidence';

  @override
  String get message35 => 'Tap to capture';

  @override
  String message36(String arg0) {
    return 'Signatory: $arg0';
  }

  @override
  String get message37 => 'Sign above line with finger or stylus';

  @override
  String get message38 => 'Clear';

  @override
  String get message39 => 'Apply Signature';

  @override
  String get message40 => 'Please enter a reason for the leave request';

  @override
  String get message41 =>
      'Leave request submitted to Store Manager for approval';

  @override
  String get message42 => 'Failed to submit leave request';

  @override
  String get message43 => 'Attendance & Leaves';

  @override
  String get message44 => 'Refresh';

  @override
  String get message45 => 'Attendance Log';

  @override
  String get message46 => 'Apply Leave';

  @override
  String get message47 => 'No attendance logs found.';

  @override
  String message48(String arg0, String arg1) {
    return 'In: $arg0  •  Out: $arg1';
  }

  @override
  String get message49 => 'Leave Request Form';

  @override
  String get message50 => 'Leave Category';

  @override
  String get message51 => 'Annual Leave (Paid)';

  @override
  String get message52 => 'Sick Leave (Doctor\'s Note)';

  @override
  String get message53 => 'Unpaid Leave / Permission';

  @override
  String get message54 => 'Maternity / Paternity';

  @override
  String get message55 => 'Special / Compassionate';

  @override
  String get message56 => 'Start Date';

  @override
  String get message57 => 'End Date';

  @override
  String get message58 => 'Reason & Justification';

  @override
  String get message59 => 'Describe necessity and handover coverage...';

  @override
  String get message60 => 'Submit Request for Approval';

  @override
  String get message61 => 'Please enter both email and password';

  @override
  String get message62 => 'SMS Worker App';

  @override
  String get message63 =>
      'Field operations, tasks, attendance & personal records';

  @override
  String get message64 => 'Work Email';

  @override
  String get message65 => 'Password';

  @override
  String get message66 => 'Sign In to Worker Workspace';

  @override
  String get message67 => 'Quick Demo Roles:';

  @override
  String get message68 => 'Driver';

  @override
  String get message69 => 'Surveyor';

  @override
  String get message70 => 'Collector';

  @override
  String get message71 => 'Salesperson';

  @override
  String get message72 => 'Manager';

  @override
  String get message73 => 'Helper';

  @override
  String get message74 => 'Sales Commission Tier & Target Policy (2026)';

  @override
  String get message75 =>
      'Sales commission is tier-based, evaluated against confirmed sales orders. Confirmation includes customer attestation and DP where applicable. Reached tier rate applies to the entire eligible amount.';

  @override
  String get message76 => 'Pre-Delivery Vehicle & Goods Inspection SOP';

  @override
  String get message77 =>
      'Drivers and helpers must complete the mandatory checklist before dispatching: tires, brakes, fuel, straps, and stock unit serial matching with Surat Jalan.';

  @override
  String get message78 => 'Cash Custody & Handover Policy for Field Workers';

  @override
  String get message79 =>
      'All cash collected from COD deliveries and field visits is held under collector custody until physically verified by the store cashier. Any short/over discrepancy must be documented.';

  @override
  String get message80 => 'Credit Survey Standards & Decisive Authority';

  @override
  String get message81 =>
      'Surveyors possess decisive approval authority on customer credit viability. Verify residence ownership, electricity bills, and original identity documents.';

  @override
  String get message82 => 'Non-Calendar Sales Period Cutoff Guidelines';

  @override
  String get message83 => 'HR / PAYROLL';

  @override
  String get message84 =>
      'Compensation periods end on the Sunday containing the target month final calendar day. Payout is processed on the Monday following cutoff.';

  @override
  String get message85 => 'Office Bulletin & SOPs';

  @override
  String get message86 => 'Search rules, guidelines, commission tiers...';

  @override
  String message87(String arg0) {
    return 'Collection not recorded; GPS unavailable: $arg0';
  }

  @override
  String get message88 => 'Field Collection Visit';

  @override
  String message89(String arg0) {
    return 'Field collection outcome recorded: $arg0 with GPS verification';
  }

  @override
  String get message90 => 'Failed to record collection attempt';

  @override
  String get message91 => 'Hand Over Cash to Cashier';

  @override
  String message92(String arg0) {
    return 'Confirm handover of Rp $arg0 to store cashier? Status will change to HANDED_OVER awaiting cashier verification.';
  }

  @override
  String get message93 => 'Cash custody handed over to cashier successfully!';

  @override
  String get message94 => 'Confirm Handover';

  @override
  String get message95 => 'Field Collection Visit';

  @override
  String get message96 => 'Cash Custody in Hand:';

  @override
  String get message97 => 'Hand Over Cash';

  @override
  String get message98 => 'Account: REC/JKT/10/2026/0088';

  @override
  String get message99 => '14 DAYS OVERDUE';

  @override
  String get message100 => 'Phone: 0811-2233-4455  •  Installment #3 of 12';

  @override
  String get message101 =>
      'Address: Jl. Pancoran Barat III No. 22, RT 04/RW 02';

  @override
  String get message102 => 'Overdue Installment Amount:';

  @override
  String get message103 => 'Open Customer 360 Profile & CRM History';

  @override
  String get message104 => 'Record Visit Outcome';

  @override
  String get message105 => 'Outcome Classification';

  @override
  String get message106 => 'Paid in Full (Cash Handover)';

  @override
  String get message107 => 'Paid via Bank Transfer';

  @override
  String get message108 => 'Promised to Pay (PTP Date)';

  @override
  String get message109 => 'Customer Not at Home';

  @override
  String get message110 => 'Refused Payment / Dispute';

  @override
  String get message111 => 'Collected Amount (Rp)';

  @override
  String get message112 => 'Installment Payment Receipt';

  @override
  String get message113 => 'Payer Signature Captured';

  @override
  String get message114 => 'Customer Payment Signature';

  @override
  String get message115 => 'Promised Payment Date';

  @override
  String get message116 => 'Location Evidence';

  @override
  String get message117 => 'Receipt Voucher';

  @override
  String get message118 => 'Collector Notes & Field Evidence';

  @override
  String get message119 =>
      'Describe conversation outcome, obstacles, customer statement...';

  @override
  String get message120 => 'Save Field Visit Record';

  @override
  String get message121 => 'Record Promise to Pay (PTP)';

  @override
  String get message122 => 'Promised Amount (Rp)';

  @override
  String get message123 => 'Promised Payment Date';

  @override
  String get message124 => 'Change';

  @override
  String get message125 => 'Customer Notes / Reason';

  @override
  String get message126 => 'Save Promise to Pay';

  @override
  String get message127 => 'Enter a valid promised amount';

  @override
  String get message128 => 'Promise to pay recorded & queued for sync';

  @override
  String get message129 => 'Field Visit / Follow-up';

  @override
  String get message130 => 'Interaction / Visit Log';

  @override
  String get message131 => 'Communication Channel';

  @override
  String get message132 => 'In-person Visit';

  @override
  String get message133 => 'Phone Call';

  @override
  String get message134 => 'WhatsApp Chat';

  @override
  String get message135 => 'Interaction Outcome';

  @override
  String get message136 => 'Reached / Met';

  @override
  String get message137 => 'Agreed Promise to Pay';

  @override
  String get message138 => 'No Answer / Empty Home';

  @override
  String get message139 => 'Refused / Complaint';

  @override
  String get message140 => 'Subject';

  @override
  String get message141 => 'Full Conversation Notes';

  @override
  String get message142 => 'Save Interaction Log';

  @override
  String get message143 => 'CRM interaction saved';

  @override
  String get message144 => 'Customer 360 CRM';

  @override
  String get message145 => 'Refresh Data';

  @override
  String get message146 => 'Customer data not found';

  @override
  String message147(String arg0, String arg1) {
    return 'NIK: $arg0 • $arg1';
  }

  @override
  String message148(String arg0) {
    return 'Score $arg0/100';
  }

  @override
  String get message149 => 'Customer Lifetime Value';

  @override
  String get message150 => 'Store Credit Balance';

  @override
  String get message151 => 'Active Promises to Pay';

  @override
  String message152(String arg0) {
    return '$arg0 PTP';
  }

  @override
  String get message153 => 'Total Completed Orders';

  @override
  String message154(String arg0) {
    return '$arg0 Orders';
  }

  @override
  String get message155 => 'Record Promise to Pay';

  @override
  String get message156 => 'Interaction Log';

  @override
  String get message157 => 'Demographic & Characteristic Tags';

  @override
  String get message158 => 'Promises to Pay (PTP)';

  @override
  String get message159 => 'No promises to pay recorded';

  @override
  String message160(String arg0, String arg1) {
    return 'Due: $arg0\n$arg1';
  }

  @override
  String get message161 => 'Recent CRM Interaction History';

  @override
  String get message162 => 'No interaction history';

  @override
  String message163(String arg0, String arg1) {
    return 'Outcome: $arg0\n$arg1';
  }

  @override
  String get message164 => 'Delivery order returned invalid data.';

  @override
  String message165(String arg0) {
    return 'Delivery order unavailable: $arg0';
  }

  @override
  String get message166 => 'Delivery Order';

  @override
  String message167(String arg0, String arg1) {
    return '$arg0\nStatus: $arg1';
  }

  @override
  String get message168 => 'Failure reason';

  @override
  String get message169 => 'Packing manifest';

  @override
  String get message170 => 'Product';

  @override
  String message171(String arg0) {
    return 'Serial: $arg0';
  }

  @override
  String get message172 =>
      'Returned to trip sheet. Navigation does not confirm arrival or delivery.';

  @override
  String get message173 => 'Scan Delivery Barcode';

  @override
  String get message174 => 'Scan Delivery Note QR or Stock Unit Serial';

  @override
  String message175(String arg0) {
    return 'Scanned barcode verified: $arg0';
  }

  @override
  String get message176 => 'Confirm Delivery Handover';

  @override
  String message177(String arg0) {
    return 'Delivery Note: $arg0';
  }

  @override
  String get message178 => 'Recipient Full Name';

  @override
  String get message179 => 'Recipient Phone';

  @override
  String get message180 => 'COD Cash Collected (Rp)';

  @override
  String message181(String arg0) {
    return 'Delivery Note $arg0 Handover';
  }

  @override
  String get message182 => 'Signature Captured';

  @override
  String get message183 => 'Customer Digital Signature';

  @override
  String get message184 => 'Goods Handover';

  @override
  String get message185 => 'Signed Delivery Note';

  @override
  String message186(String arg0) {
    return 'Delivery not confirmed; GPS unavailable: $arg0';
  }

  @override
  String message187(String arg0, String arg1, String arg2, String arg3) {
    return 'Handover verified via GPS [$arg0, $arg1]. Signature captured: $arg2. Photos: $arg3';
  }

  @override
  String get message188 => 'Delivery confirmed.';

  @override
  String get message189 =>
      'Delivery was not confirmed by server. Check connection and retry.';

  @override
  String get message190 => 'Report Delivery Failure';

  @override
  String get message191 => 'Failure Reason';

  @override
  String get message192 => 'Customer Unreachable / Not Home';

  @override
  String get message193 => 'Wrong / Incomplete Address';

  @override
  String get message194 => 'Customer Refused Goods';

  @override
  String get message195 => 'Item Damaged in Transit';

  @override
  String get message196 => 'Operational Notes';

  @override
  String get message197 => 'Delivery Failure Proof';

  @override
  String message198(String arg0) {
    return 'Failure not reported; GPS unavailable: $arg0';
  }

  @override
  String message199(String arg0, String arg1, String arg2, String arg3) {
    return '$arg0 GPS: $arg1, $arg2. Failure proof photos: $arg3.';
  }

  @override
  String get message200 =>
      'Failure report submitted. Dispatcher must reschedule delivery.';

  @override
  String message201(String arg0) {
    return 'Report not saved: $arg0';
  }

  @override
  String get message202 => 'Submit Failure Report';

  @override
  String get message203 => 'Driver Trip Execution';

  @override
  String message204(String arg0) {
    return 'Trip: $arg0';
  }

  @override
  String get message205 => 'Barcode Scanner';

  @override
  String get message206 => 'Vehicle not assigned';

  @override
  String get message207 => 'No trip loaded';

  @override
  String message208(String arg0, String arg1) {
    return '$arg0 / $arg1 Drops';
  }

  @override
  String get message209 => 'COD Custody Cash Balance:';

  @override
  String get message210 => 'No active delivery stops for this trip.';

  @override
  String message211(String arg0, String arg1) {
    return 'Stop #$arg0  •  $arg1';
  }

  @override
  String message212(String arg0) {
    return 'Phone: $arg0';
  }

  @override
  String message213(String arg0) {
    return 'Address: $arg0';
  }

  @override
  String message214(String arg0) {
    return 'Delivery window: $arg0 WIB';
  }

  @override
  String message215(String arg0, String arg1) {
    return '$arg0 (SN: $arg1)';
  }

  @override
  String get message216 => 'Verify Serial Barcode';

  @override
  String message217(String arg0) {
    return 'COD Collection Required: Rp $arg0';
  }

  @override
  String get message218 => 'Failed / Refused';

  @override
  String get message219 => 'Handover Done';

  @override
  String message220(String arg0) {
    return 'Navigation preference could not load: $arg0';
  }

  @override
  String get message221 => 'Navigation is not available in this build.';

  @override
  String get message222 =>
      'Share only destination GPS with your chosen navigation app. Choice is remembered for one-tap navigation. Return using Maps callback or the system Back/app switcher.';

  @override
  String message223(String arg0) {
    return 'Navigation could not open: $arg0';
  }

  @override
  String get message224 =>
      'Navigation unavailable: destination GPS missing or invalid. Ask dispatch to supply verified coordinates.';

  @override
  String get message225 => 'External navigation requires Android or iOS.';

  @override
  String get message226 => 'Opening navigation...';

  @override
  String get message227 => 'Choose navigation app';

  @override
  String get message228 => 'Clocked out successfully for today';

  @override
  String get message229 => 'Outside Store Geofence';

  @override
  String message230(String arg0) {
    return 'Your GPS position ($arg0) is outside the authorized store perimeter (200m). Please clock-in inside the store building.';
  }

  @override
  String get message231 => 'OK';

  @override
  String message232(String arg0, String arg1, String arg2) {
    return 'GPS Verified: [$arg0, $arg1] (Accuracy: ${arg2}m)';
  }

  @override
  String get message233 =>
      'GPS Geofence Verified: Clock-in recorded (PRESENT at store)';

  @override
  String get message234 =>
      'Biometric identity confirmed (Fingerprint / Face ID verified)';

  @override
  String get message235 => 'Worker App';

  @override
  String get message236 => 'Actionable Notifications';

  @override
  String get message237 => 'Verify Biometrics';

  @override
  String get message238 => 'Sign Out';

  @override
  String message239(String arg0) {
    return '$arg0 Offline Action(s) Queued';
  }

  @override
  String get message240 => 'Auto-syncing in background when connected';

  @override
  String get message241 => 'Sync Now';

  @override
  String get message242 => 'Clocked In (Present)';

  @override
  String get message243 => 'Daily Attendance';

  @override
  String message244(String arg0) {
    return 'Verified: $arg0';
  }

  @override
  String get message245 => 'Requires GPS Geofence Check';

  @override
  String get message246 => 'Clock Out';

  @override
  String get message247 => 'Clock In';

  @override
  String get message248 => 'My Active Work';

  @override
  String get message249 => 'Credit Surveys Queue';

  @override
  String message250(String arg0) {
    return '$arg0 survey(s) • KTP/KK/GPS Photo Evidence';
  }

  @override
  String message251(String arg0) {
    return '$arg0 PENDING';
  }

  @override
  String get message252 => 'Active Delivery Trip';

  @override
  String message253(String arg0, String arg1) {
    return '$arg0 • $arg1 Drops • Barcode & Signature';
  }

  @override
  String get message254 => 'Field Collection Visits';

  @override
  String message255(String arg0, String arg1) {
    return '$arg0 accounts • Cash: Rp $arg1';
  }

  @override
  String message256(String arg0) {
    return '$arg0 DUE';
  }

  @override
  String get message257 => 'Sales & Customer Follow-Ups';

  @override
  String get message258 =>
      'Confirmed orders eligible for commission recognition';

  @override
  String get message259 => 'Assigned Helper Tasks';

  @override
  String get message260 => 'Loading delivery trip truck • Showroom prep';

  @override
  String get message261 => 'Personal Records & Company';

  @override
  String get message262 => 'GPS Geofence history';

  @override
  String get message263 => 'My Payroll Slips';

  @override
  String get message264 => 'Salary & commissions';

  @override
  String get message265 => 'Office Bulletin';

  @override
  String get message266 => 'Rules, SOPs & targets';

  @override
  String get message267 => 'My Task Center';

  @override
  String get message268 => 'All assigned tasks';

  @override
  String get message269 => 'Mobile Stocktake';

  @override
  String get message270 => 'Scan and compare book balance';

  @override
  String get message271 => 'Warehouse Picking';

  @override
  String get message272 => 'Verify manifest serials';

  @override
  String get message273 => 'Stocktake session returned invalid data.';

  @override
  String message274(String arg0) {
    return 'Stocktake session unavailable: $arg0';
  }

  @override
  String get message275 => 'Count reviewed';

  @override
  String get message276 => 'Count rejected for recount';

  @override
  String get message277 => 'Stocktake reviewed. Inventory unchanged.';

  @override
  String get message278 => 'Stocktake rejected for recount.';

  @override
  String message279(String arg0) {
    return 'Review failed: $arg0';
  }

  @override
  String get message280 => 'Review Stocktake';

  @override
  String message281(String arg0, String arg1) {
    return 'Status: $arg0 • $arg1 variance(s)';
  }

  @override
  String get message282 => 'Unknown product';

  @override
  String get message283 => 'Reject / Recount';

  @override
  String get message284 => 'Approve Review';

  @override
  String message285(String arg0) {
    return 'Saved stocktake session could not be read: $arg0';
  }

  @override
  String get message286 => 'Your profile has no store assignment.';

  @override
  String message287(String arg0) {
    return 'Could not load book balance: $arg0';
  }

  @override
  String get message288 =>
      'No server session exists. Connect and start a session before submitting.';

  @override
  String get message289 => 'Stocktake submission returned invalid data.';

  @override
  String get message290 =>
      'Count submitted for supervisor review. Inventory unchanged.';

  @override
  String message291(String arg0) {
    return 'Count not submitted; local scans retained: $arg0';
  }

  @override
  String get message292 => 'Stocktake Scan';

  @override
  String get message293 => 'Scan stock unit serial. Manual entry available.';

  @override
  String message294(String arg0) {
    return 'Duplicate scan ignored: $arg0';
  }

  @override
  String get message295 => 'Scan Unit';

  @override
  String get message296 => 'Blind count';

  @override
  String message297(String arg0, String arg1) {
    return '$arg0 scanned • $arg1';
  }

  @override
  String get message298 =>
      'Expected inventory stays hidden. Scans save on this device while offline. Submissions go to supervisor review and never adjust inventory.';

  @override
  String get message299 => 'Submit for supervisor review';

  @override
  String get message300 => 'Start new session';

  @override
  String message301(String arg0) {
    return 'Scanned serials ($arg0)';
  }

  @override
  String get message302 => 'Picking manifest returned invalid data.';

  @override
  String message303(String arg0) {
    return 'Picking manifest unavailable: $arg0';
  }

  @override
  String message304(String arg0) {
    return 'No stock-unit serials assigned to $arg0.';
  }

  @override
  String get message305 => 'Verify Packing Manifest';

  @override
  String message306(String arg0, String arg1) {
    return 'Scan $arg0 stock-unit serial(s) for $arg1';
  }

  @override
  String message307(String arg0, String arg1) {
    return 'Unexpected serial for $arg0: $arg1';
  }

  @override
  String get message308 => 'Server did not confirm packing verification.';

  @override
  String message309(String arg0) {
    return '$arg0 packing verified.';
  }

  @override
  String message310(String arg0) {
    return 'Packing verification failed: $arg0';
  }

  @override
  String get message311 => 'Guided Picking & Packing';

  @override
  String get message312 => 'Refresh manifests';

  @override
  String message313(String arg0, String arg1) {
    return '$arg0 / $arg1 manifests verified';
  }

  @override
  String get message314 => 'No pending delivery manifests.';

  @override
  String get message315 => 'Product manifest';

  @override
  String message316(String arg0) {
    return 'Customer: $arg0';
  }

  @override
  String message317(String arg0) {
    return 'Expected units: $arg0';
  }

  @override
  String get message318 => 'Manifest verified';

  @override
  String message319(String arg0, String arg1) {
    return '$arg0 / $arg1 scanned';
  }

  @override
  String get message320 => 'Scan';

  @override
  String get message321 => 'Notifications returned invalid data.';

  @override
  String message322(String arg0) {
    return 'Notifications unavailable: $arg0';
  }

  @override
  String message323(String arg0) {
    return 'Could not mark notification read: $arg0';
  }

  @override
  String get message324 => 'Approval steps returned invalid data.';

  @override
  String get message325 => 'No pending approval step found.';

  @override
  String get message326 => 'Decided from mobile notification';

  @override
  String get message327 => 'Approval recorded.';

  @override
  String get message328 => 'Rejection recorded.';

  @override
  String message329(String arg0) {
    return 'Approval action failed: $arg0';
  }

  @override
  String get message330 => 'Retry';

  @override
  String get message331 => 'No notifications.';

  @override
  String get message332 => 'Open document';

  @override
  String get message333 => 'Reject';

  @override
  String get message334 => 'Approve';

  @override
  String get message335 => 'My Payroll & Compensation';

  @override
  String get message336 => 'No payroll slips available yet.';

  @override
  String message337(String arg0, String arg1) {
    return 'Cutoff: $arg0 • Payout: $arg1';
  }

  @override
  String get message338 => 'Total Net Payout (Transfer)';

  @override
  String get message339 => 'Disbursed via BCA Payroll Account';

  @override
  String get message340 => 'Earnings & Commission Breakdown';

  @override
  String get message341 => 'Base Salary (Prorated)';

  @override
  String get message342 => 'Confirmed Sales Commission';

  @override
  String get message343 => 'Collection Recovery Incentive';

  @override
  String get message344 => 'Operational & Fuel Allowance';

  @override
  String get message345 => 'Gross Earnings';

  @override
  String get message346 => 'Deductions & Adjustments';

  @override
  String get message347 => 'Attendance & Late Deductions';

  @override
  String get message348 => 'Total Deductions';

  @override
  String get message349 => 'Catalog Product';

  @override
  String get message350 => 'Product Simulation';

  @override
  String message351(String arg0) {
    return 'Catalog search failed: $arg0';
  }

  @override
  String get message352 =>
      'Credit simulation copied! Ready to send to WhatsApp/buyer.';

  @override
  String get message353 => 'Credit Calculator & Simulation';

  @override
  String get message354 => 'Copy Quote (WhatsApp)';

  @override
  String get message355 => 'Reset Input';

  @override
  String get message356 =>
      'Simulate credit installments for buyer-specific terms (10% down payment, custom amount, or flexible term).';

  @override
  String get message357 => 'Product Source';

  @override
  String get message358 => 'Manual Input';

  @override
  String get message359 => 'Store Catalog';

  @override
  String message360(String arg0) {
    return 'Code: $arg0';
  }

  @override
  String get message361 => 'Search product name / code...';

  @override
  String get message362 => 'Search';

  @override
  String get message363 => 'Product / Package Name (Optional)';

  @override
  String get message364 => 'Example: Smart TV 43\" UHD / L Sofa Package';

  @override
  String get message365 => 'Base Price (HD / Cash OTR)';

  @override
  String get message366 => 'Base Price Amount';

  @override
  String get message367 => '+500 K';

  @override
  String get message368 => '+1 M';

  @override
  String get message369 => '+2 M';

  @override
  String get message370 => '+5 M';

  @override
  String get message371 => 'Down Payment (DP)';

  @override
  String get message372 => 'Standard';

  @override
  String get message373 => 'Percentage (%)';

  @override
  String get message374 => 'Amount (Rp)';

  @override
  String message375(String arg0, String arg1) {
    return 'System recommendation: $arg0 ($arg1)';
  }

  @override
  String message376(String arg0, String arg1) {
    return 'Choose Down Payment Percentage: $arg0% = $arg1';
  }

  @override
  String get message377 => 'Down payment amount agreed with buyer';

  @override
  String get message378 => 'Example: 750000';

  @override
  String message379(String arg0) {
    return 'Equivalent to $arg0% of Base Price';
  }

  @override
  String get message380 => 'Net Financing Principal (h1):';

  @override
  String message381(String arg0) {
    return '$arg0 (incl. Rp 30K fee)';
  }

  @override
  String get message382 => '15% Timely Payment Discount';

  @override
  String get message383 => 'Term & Installment Options';

  @override
  String message384(String arg0) {
    return '$arg0 Options Available';
  }

  @override
  String message385(String arg0) {
    return '$arg0 Months';
  }

  @override
  String message386(String arg0) {
    return 'Total Payment: $arg0';
  }

  @override
  String message387(String arg0) {
    return 'Save Rp ${arg0}K/month (15% Discount)';
  }

  @override
  String get message388 => 'Retail Formula Details (Company Standard)';

  @override
  String message389(String arg0) {
    return 'Calculation breakdown for a $arg0-month term';
  }

  @override
  String get message390 => '1. Net Principal (h1)';

  @override
  String get message391 => '2. Flat Interest (h2)';

  @override
  String message392(String arg0) {
    return 'h1 × (1 + 4% × $arg0 months)';
  }

  @override
  String get message393 => '3. Gross Installment (h3)';

  @override
  String message394(String arg0) {
    return '$arg0/month';
  }

  @override
  String get message395 => '4. Timely Payment Discount (h4)';

  @override
  String get message396 => 'h3 × 85% (15% Discount)';

  @override
  String get message397 => '5. Final Result';

  @override
  String get message398 => 'Copy Simulation for WhatsApp';

  @override
  String message399(String arg0, String arg1) {
    return 'Use $arg0-Month Term ($arg1/month)';
  }

  @override
  String get message400 => 'Sales order returned invalid data.';

  @override
  String message401(String arg0) {
    return 'Sales order unavailable: $arg0';
  }

  @override
  String get message402 => 'Sales Order';

  @override
  String get message403 => 'Customer';

  @override
  String message404(String arg0) {
    return 'Status: $arg0';
  }

  @override
  String get message405 => 'Item';

  @override
  String message406(String arg0) {
    return 'Quantity: $arg0';
  }

  @override
  String get message407 => 'Quote total';

  @override
  String get message408 =>
      'Sales progress unavailable. Check access or connection.';

  @override
  String get message409 => 'Enter customer name or phone to search.';

  @override
  String get message410 => 'Customer search returned invalid data.';

  @override
  String message411(String arg0) {
    return 'Customer search failed: $arg0';
  }

  @override
  String message412(String arg0) {
    return 'Draft quotation could not be created: $arg0';
  }

  @override
  String get message413 => 'Enter product name or code to search.';

  @override
  String get message414 => 'Product search returned invalid data.';

  @override
  String message415(String arg0) {
    return 'Product search failed: $arg0';
  }

  @override
  String get message416 => 'No active product variants found.';

  @override
  String get message417 => 'No active store price for this product.';

  @override
  String get message418 => 'Quote items returned invalid data.';

  @override
  String message419(String arg0) {
    return '$arg0 added to draft quote.';
  }

  @override
  String message420(String arg0) {
    return 'Could not add product to quote: $arg0';
  }

  @override
  String message421(String arg0, String arg1, String arg2) {
    return 'Simulation: $arg0 ($arg1 months @ $arg2/month)';
  }

  @override
  String message422(String arg0, String arg1, String arg2) {
    return 'Simulation $arg0: $arg1 months @ $arg2/month';
  }

  @override
  String get message423 => 'Salesperson Work Center';

  @override
  String get message424 => 'Sales progress unavailable';

  @override
  String message425(String arg0) {
    return '$arg0 confirmed orders this month';
  }

  @override
  String get message426 => 'Refresh progress';

  @override
  String message427(String arg0, String arg1, String arg2) {
    return 'Actual: $arg0 / Target: $arg1 ($arg2%)';
  }

  @override
  String message428(String arg0) {
    return 'Estimated Commission: $arg0';
  }

  @override
  String get message429 => 'Credit Calculator & Simulation';

  @override
  String get message430 =>
      'Simulate installments with custom down payment (10%, custom amount, or custom term).';

  @override
  String get message431 => 'Open';

  @override
  String get message432 => 'Find customer';

  @override
  String message433(String arg0) {
    return 'Quote draft: $arg0';
  }

  @override
  String get message434 => 'Customer name or phone';

  @override
  String get message435 => 'Search Customers';

  @override
  String get message436 => 'Create draft quotation';

  @override
  String get message437 => 'Product name or code';

  @override
  String get message438 => 'Search Products';

  @override
  String get message439 => 'Simulate credit for this product';

  @override
  String get message440 => 'Add one unit at store cash price';

  @override
  String get message441 => 'Customer Location Survey';

  @override
  String message442(String arg0) {
    return 'Could not capture GPS location: $arg0';
  }

  @override
  String message443(String arg0) {
    return 'Confirm $arg0 Survey?';
  }

  @override
  String get message444 =>
      'This will approve customer credit eligibility and advance the sales order to confirmation.';

  @override
  String get message445 =>
      'This will reject credit eligibility and set the sales order to terminal SURVEY_REJECTED.';

  @override
  String get message446 => 'Confirm Approval';

  @override
  String get message447 => 'Confirm Rejection';

  @override
  String message448(String arg0) {
    return 'Survey decision not submitted; GPS unavailable: $arg0';
  }

  @override
  String get message449 =>
      'Survey profile was not saved. Check connection and retry.';

  @override
  String message450(String arg0, String arg1) {
    return 'Credit survey decision recorded: $arg0 with GPS & $arg1 photos';
  }

  @override
  String get message451 => 'Failed to submit survey decision';

  @override
  String get message452 => 'Credit Survey Assessment';

  @override
  String message453(String arg0) {
    return 'Survey ID: $arg0';
  }

  @override
  String get message454 => 'NIK: 3171021405880003  •  Phone: 0812-8899-7711';

  @override
  String get message455 =>
      'Address: Jl. Tebet Barat Dalam VII No. 4, Jakarta Selatan';

  @override
  String get message456 => 'Delivery Location Profile';

  @override
  String get message457 => 'Destination GPS not captured';

  @override
  String message458(String arg0, String arg1, String arg2) {
    return 'GPS: $arg0, $arg1 (±$arg2 m)';
  }

  @override
  String get message459 => 'Capture destination GPS';

  @override
  String get message460 => 'Alley width (meters)';

  @override
  String get message461 => 'Stair / doorway clearance (meters)';

  @override
  String get message462 => 'Gate and delivery access notes';

  @override
  String get message463 =>
      'Gate width, access hours, stairs, parking constraints';

  @override
  String get message464 => 'Residence & Financial Verification';

  @override
  String get message465 => 'Home Ownership Status';

  @override
  String get message466 => 'Self-owned';

  @override
  String get message467 => 'Family-owned';

  @override
  String get message468 => 'Annual Rental (Contract)';

  @override
  String get message469 => 'Boarding / Monthly Rental';

  @override
  String get message470 => 'Estimated Net Monthly Income (Rp)';

  @override
  String get message471 => 'Estimated Monthly Living Expenses (Rp)';

  @override
  String get message472 => 'Other Existing Installments / Obligations';

  @override
  String get message473 => 'Customer ID Card (KTP)';

  @override
  String get message474 => 'Family Card (KK)';

  @override
  String get message475 => 'Electricity / Water Proof';

  @override
  String get message476 => 'House & Front Door';

  @override
  String get message477 => 'Field Physical Document Checks';

  @override
  String get message478 => 'Original KTP Verified on site';

  @override
  String get message479 => 'Family Card (KK) verified';

  @override
  String get message480 =>
      'Recent Electricity / Water Utility Bill matches address';

  @override
  String get message481 => 'Proof of Income / Payslip / Bank Statement';

  @override
  String get message482 => 'Surveyor Assessment & Justification';

  @override
  String get message483 => 'Assessment Notes';

  @override
  String get message484 =>
      'Provide detailed justification for credit viability...';

  @override
  String get message485 => 'Reject Credit';

  @override
  String get message486 => 'Approve Credit';

  @override
  String message487(String arg0) {
    return 'Credit Survey: Customer #$arg0';
  }

  @override
  String message488(String arg0, String arg1) {
    return 'Delivery: $arg0 ($arg1)';
  }

  @override
  String message489(String arg0) {
    return 'Field Collection: $arg0';
  }

  @override
  String get message490 => 'Warehouse Truck Prep & Helper Inspection';

  @override
  String get message491 => 'My Work & Task Queue';

  @override
  String get message492 => 'All Tasks';

  @override
  String get message493 => 'Deliveries';

  @override
  String get message494 => 'Surveys';

  @override
  String get message495 => 'Collections';

  @override
  String get message496 => 'Helper / Floor';

  @override
  String get message497 => 'No operational tasks for this filter.';
}
