import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/home/screens/worker_home_screen.dart';
import '../features/attendance/screens/attendance_screen.dart';
import '../features/tasks/screens/my_work_screen.dart';
import '../features/surveys/screens/surveyor_task_screen.dart';
import '../features/delivery/screens/driver_trip_screen.dart';
import '../features/delivery/screens/delivery_order_detail_screen.dart';
import '../features/collection/screens/collector_visit_screen.dart';
import '../features/payroll/screens/my_payroll_screen.dart';
import '../features/bulletin/screens/bulletin_screen.dart';
import '../features/sales/screens/sales_work_center_screen.dart';
import '../features/sales/screens/sales_order_detail_screen.dart';
import '../features/inventory/screens/stocktake_screen.dart';
import '../features/inventory/screens/warehouse_picking_screen.dart';
import '../features/inventory/screens/stocktake_review_screen.dart';
import '../features/notifications/screens/notification_center_screen.dart';
import '../features/customer_crm/screens/customer_360_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: authState.isAuthenticated ? '/home' : '/login',
    redirect: (context, state) {
      final isLoggingIn = state.matchedLocation == '/login';
      if (!authState.isAuthenticated && !isLoggingIn) {
        return '/login';
      }
      if (authState.isAuthenticated && isLoggingIn) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const WorkerHomeScreen(),
      ),
      GoRoute(
        path: '/attendance',
        name: 'attendance',
        builder: (context, state) => const AttendanceScreen(),
      ),
      GoRoute(
        path: '/my-work',
        name: 'my-work',
        builder: (context, state) => const MyWorkScreen(),
      ),
      GoRoute(
        path: '/survey/:id',
        name: 'survey-detail',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? 'SRV-001';
          return SurveyorTaskScreen(surveyId: id);
        },
      ),
      GoRoute(
        path: '/delivery/:id',
        name: 'delivery-detail',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? 'TRIP-001';
          return DriverTripScreen(tripId: id);
        },
      ),
      GoRoute(
        path: '/delivery-order/:id',
        name: 'delivery-order-detail',
        builder: (context, state) => DeliveryOrderDetailScreen(
          deliveryOrderId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/collection/:id',
        name: 'collection-detail',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? 'COL-001';
          return CollectorVisitScreen(visitId: id);
        },
      ),
      GoRoute(
        path: '/payroll',
        name: 'payroll',
        builder: (context, state) => const MyPayrollScreen(),
      ),
      GoRoute(
        path: '/bulletin',
        name: 'bulletin',
        builder: (context, state) => const BulletinScreen(),
      ),
      GoRoute(
        path: '/sales-work-center',
        name: 'sales-work-center',
        builder: (context, state) => const SalesWorkCenterScreen(),
      ),
      GoRoute(
        path: '/sales-order/:id',
        name: 'sales-order-detail',
        builder: (context, state) =>
            SalesOrderDetailScreen(salesOrderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/warehouse-picking',
        name: 'warehouse-picking',
        builder: (context, state) => const WarehousePickingScreen(),
      ),
      GoRoute(
        path: '/stocktake',
        name: 'stocktake',
        builder: (context, state) => const StocktakeScreen(),
      ),
      GoRoute(
        path: '/stocktake-review/:id',
        name: 'stocktake-review',
        builder: (context, state) =>
            StocktakeReviewScreen(sessionId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationCenterScreen(),
      ),
      GoRoute(
        path: '/customer-360/:id',
        name: 'customer-360',
        builder: (context, state) => Customer360Screen(
          customerId: state.pathParameters['id'] ?? 'cust-101',
        ),
      ),
    ],
  );
});
