import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class BulletinScreen extends StatefulWidget {
  const BulletinScreen({super.key});

  @override
  State<BulletinScreen> createState() => _BulletinScreenState();
}

class _BulletinScreenState extends State<BulletinScreen> {
  final _searchController = TextEditingController();

  final List<Map<String, String>> _articles = [
    {
      'title': 'Sales Commission Tier & Target Policy (2026)',
      'category': 'COMPENSATION',
      'date': '01 Oct 2026',
      'summary':
          'Sales commission is tier-based, evaluated against confirmed sales orders. Confirmation includes customer attestation and DP where applicable. Reached tier rate applies to the entire eligible amount.',
    },
    {
      'title': 'Pre-Delivery Vehicle & Goods Inspection SOP',
      'category': 'LOGISTICS',
      'date': '28 Sep 2026',
      'summary':
          'Drivers and helpers must complete the mandatory checklist before dispatching: tires, brakes, fuel, straps, and stock unit serial matching with Surat Jalan.',
    },
    {
      'title': 'Cash Custody & Handover Policy for Field Workers',
      'category': 'FINANCE',
      'date': '15 Sep 2026',
      'summary':
          'All cash collected from COD deliveries and field visits is held under collector custody until physically verified by the store cashier. Any short/over discrepancy must be documented.',
    },
    {
      'title': 'Credit Survey Standards & Decisive Authority',
      'category': 'SURVEY',
      'date': '10 Sep 2026',
      'summary':
          'Surveyors possess decisive approval authority on customer credit viability. Verify residence ownership, electricity bills, and original identity documents.',
    },
    {
      'title': 'Non-Calendar Sales Period Cutoff Guidelines',
      'category': 'HR / PAYROLL',
      'date': '01 Sep 2026',
      'summary':
          'Compensation periods end on the Sunday containing the target month final calendar day. Payout is processed on the Monday following cutoff.',
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
        title: const Text('Office Bulletin & SOPs'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search rules, guidelines, commission tiers...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
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
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Chip(
                            label: Text(article['category']!),
                            labelStyle: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary),
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                            side: BorderSide.none,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            article['date']!,
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          article['summary']!,
                          style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.textPrimary),
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
