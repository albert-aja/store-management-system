class TaskCommentModel {
  final String id;
  final String taskId;
  final String authorId;
  final String authorName;
  final String message;
  final String? attachmentUrl;
  final DateTime? createdAt;

  TaskCommentModel({
    required this.id,
    required this.taskId,
    required this.authorId,
    required this.authorName,
    required this.message,
    this.attachmentUrl,
    this.createdAt,
  });

  factory TaskCommentModel.fromJson(Map<String, dynamic> json) {
    return TaskCommentModel(
      id: json['id'] as String? ?? '',
      taskId: json['taskId'] as String? ?? '',
      authorId: json['authorId'] as String? ?? '',
      authorName: json['authorName'] as String? ?? '-',
      message: json['message'] as String? ?? '',
      attachmentUrl: json['attachmentUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'authorId': authorId,
        'authorName': authorName,
        'message': message,
        'attachmentUrl': attachmentUrl,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class OperationalTaskModel {
  final String id;
  final String taskNumber;
  final String title;
  final String? description;
  final String category;
  final String priority;
  final String status;
  final DateTime? dueDate;
  final String assignerId;
  final String assignerName;
  final String assigneeId;
  final String assigneeName;
  final String? storeId;
  final DateTime? completedAt;
  final String? completionNotes;
  final int commentCount;
  final bool isOverdue;
  final List<TaskCommentModel> comments;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  OperationalTaskModel({
    required this.id,
    required this.taskNumber,
    required this.title,
    this.description,
    required this.category,
    required this.priority,
    required this.status,
    this.dueDate,
    required this.assignerId,
    required this.assignerName,
    required this.assigneeId,
    required this.assigneeName,
    this.storeId,
    this.completedAt,
    this.completionNotes,
    this.commentCount = 0,
    this.isOverdue = false,
    this.comments = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory OperationalTaskModel.fromJson(Map<String, dynamic> json) {
    var rawComments = json['comments'] as List<dynamic>? ?? [];
    List<TaskCommentModel> commentsList = rawComments
        .map((c) => TaskCommentModel.fromJson(c as Map<String, dynamic>))
        .toList();

    return OperationalTaskModel(
      id: json['id'] as String? ?? '',
      taskNumber: json['taskNumber'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'GENERAL',
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'PENDING',
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'].toString())
          : null,
      assignerId: json['assignerId'] as String? ?? '',
      assignerName: json['assignerName'] as String? ?? '-',
      assigneeId: json['assigneeId'] as String? ?? '',
      assigneeName: json['assigneeName'] as String? ?? '-',
      storeId: json['storeId'] as String?,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'].toString())
          : null,
      completionNotes: json['completionNotes'] as String?,
      commentCount: json['commentCount'] as int? ?? commentsList.length,
      isOverdue: json['isOverdue'] as bool? ?? false,
      comments: commentsList,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }

  OperationalTaskModel copyWith({
    String? status,
    DateTime? completedAt,
    String? completionNotes,
    List<TaskCommentModel>? comments,
    int? commentCount,
  }) {
    return OperationalTaskModel(
      id: id,
      taskNumber: taskNumber,
      title: title,
      description: description,
      category: category,
      priority: priority,
      status: status ?? this.status,
      dueDate: dueDate,
      assignerId: assignerId,
      assignerName: assignerName,
      assigneeId: assigneeId,
      assigneeName: assigneeName,
      storeId: storeId,
      completedAt: completedAt ?? this.completedAt,
      completionNotes: completionNotes ?? this.completionNotes,
      commentCount: commentCount ?? this.commentCount,
      isOverdue: isOverdue,
      comments: comments ?? this.comments,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

