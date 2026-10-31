import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/localization/worker_format.dart';

class BulletinScreen extends StatefulWidget {
  const BulletinScreen({super.key});

  @override
  State<BulletinScreen> createState() => _BulletinScreenState();
}

class _BulletinScreenState extends State<BulletinScreen> {
  final _searchController = TextEditingController();

  List<Map<String, String>> get _articles => [
    {
      'title': context.l10n.message74,
      'category': 'COMPENSATION',
      'date': '2026-10-01',
      'summary': context.l10n.message75,
    },
    {
      'title': context.l10n.message76,
      'category': 'LOGISTICS',
      'date': '2026-09-28',
      'summary': context.l10n.message77,
    },
    {
      'title': context.l10n.message78,
      'category': 'FINANCE',
      'date': '2026-09-15',
      'summary': context.l10n.message79,
    },
    {
      'title': context.l10n.message80,
      'category': 'SURVEY',
      'date': '2026-09-10',
      'summary': context.l10n.message81,
    },
    {
      'title': context.l10n.message82,
      'category': context.l10n.message83,
      'date': '2026-09-01',
      'summary': context.l10n.message84,
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.toLowerCase();
    final filtered = _articles.where((a) {
      return a['title']!.toLowerCase().contains(query) ||
          a['summary']!.toLowerCase().contains(query) ||
          a['category']!.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message85),
        actions: const [WorkerLanguageSwitcher()],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: context.l10n.message86,
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        tooltip: context.l10n.message38,
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          setState(() => _searchController.clear());
                        },
                      )
                    : null,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: filtered.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final article = filtered[index];
                return Card(
                  child: ExpansionTile(
                    title: Text(
                      article['title']!,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Chip(
                            label: Text(context.uiCode(article['category']!)),
                            labelStyle: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.1,
                            ),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                            side: BorderSide.none,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.dateValue(article['date']!),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          article['summary']!,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.5,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
