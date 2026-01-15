# Requirements Document

## Introduction

نظام إدارة صيدليات احترافي مع واجهة إدارة مركزية يتيح للـ Admin التحكم الكامل في الصيدليات والأدوية. يركز النظام على الأمان، إدارة الصلاحيات، ومراجعة الأدوية قبل نشرها.

## Glossary

- **Admin**: المسؤول الرئيسي للنظام الذي يملك كامل الصلاحيات
- **Pharmacy**: صيدلية مسجلة في النظام مع حساب مستقل
- **Medicine**: دواء يتم إضافته من قبل الصيدلية ويخضع لمراجعة Admin
- **Medicine_Status**: حالة الدواء (pending/approved/rejected)
- **Pharmacy_Status**: حالة الصيدلية (active/inactive/suspended)
- **Medicine_Limit**: الحد الأقصى لعدد الأدوية المسموح للصيدلية بإضافتها
- **Audit_Log**: سجل يحتوي على جميع الإجراءات المهمة في النظام
- **Session**: جلسة تسجيل دخول آمنة للمستخدم

## Requirements

### Requirement 1: إدارة حسابات الصيدليات

**User Story:** As an Admin, I want to create and manage pharmacy accounts, so that I can control which pharmacies operate in the system.

#### Acceptance Criteria

1. WHEN the Admin submits pharmacy creation form with name, email, and password, THE System SHALL create a new pharmacy account with hashed password and inactive status
2. WHEN a new pharmacy account is created, THE System SHALL send email verification to the pharmacy email address
3. WHEN the Admin views the pharmacies list, THE System SHALL display all pharmacies with their status (active/inactive/suspended)
4. WHEN the Admin searches for a pharmacy, THE System SHALL filter results by name, email, or status
5. WHEN the Admin activates a pharmacy, THE System SHALL update the pharmacy status to active and log the action
6. WHEN the Admin deactivates a pharmacy, THE System SHALL update the pharmacy status to inactive and prevent pharmacy login
7. WHEN the Admin suspends a pharmacy permanently, THE System SHALL update the pharmacy status to suspended and disable all pharmacy operations

### Requirement 2: تسجيل دخول الصيدلية

**User Story:** As a Pharmacy, I want to securely log in to my account, so that I can manage my medicines and view my status.

#### Acceptance Criteria

1. WHEN a pharmacy submits valid email and password, THE Auth_System SHALL verify credentials and create a secure session
2. WHEN a pharmacy with inactive or suspended status attempts login, THE Auth_System SHALL reject the login and display appropriate message
3. WHEN a pharmacy session expires or is invalidated, THE Auth_System SHALL require re-authentication
4. WHEN a pharmacy logs out, THE Auth_System SHALL invalidate the current session
5. IF invalid credentials are submitted 5 times, THEN THE Auth_System SHALL temporarily lock the account for 15 minutes

### Requirement 3: إدارة الأدوية من قبل الصيدلية

**User Story:** As a Pharmacy, I want to add and manage medicines, so that I can make them available for customers after Admin approval.

#### Acceptance Criteria

1. WHEN a pharmacy submits a new medicine with required fields (name, code, description, price, quantity, category, image), THE Medicine_System SHALL create the medicine with pending status
2. WHEN a pharmacy has reached their medicine limit, THE Medicine_System SHALL prevent adding new medicines and display limit message
3. WHEN a pharmacy views their medicines, THE Medicine_System SHALL display all medicines grouped by status (pending/approved/rejected)
4. WHEN a pharmacy edits a pending medicine, THE Medicine_System SHALL update the medicine data
5. WHEN a pharmacy edits a rejected medicine, THE Medicine_System SHALL update the medicine and reset status to pending for re-review
6. THE Medicine_System SHALL NOT allow editing of approved medicines without Admin permission

### Requirement 4: مراجعة الأدوية من قبل Admin

**User Story:** As an Admin, I want to review and approve/reject medicines, so that I can ensure quality control of medicines in the system.

#### Acceptance Criteria

1. WHEN the Admin views pending medicines, THE Review_System SHALL display all medicines awaiting approval with pharmacy information
2. WHEN the Admin approves a medicine, THE Review_System SHALL update medicine status to approved and notify the pharmacy
3. WHEN the Admin rejects a medicine with notes, THE Review_System SHALL update medicine status to rejected, store rejection notes, and notify the pharmacy
4. WHEN the Admin filters medicines, THE Review_System SHALL filter by status, pharmacy, or date range
5. WHEN a medicine is approved or rejected, THE Audit_System SHALL log the action with Admin ID, timestamp, and notes

### Requirement 5: إدارة حدود الأدوية

**User Story:** As an Admin, I want to set medicine limits for each pharmacy, so that I can control the scale of each pharmacy's operations.

#### Acceptance Criteria

1. WHEN the Admin sets a medicine limit for a pharmacy, THE Limit_System SHALL store the limit and enforce it on medicine additions
2. WHEN the Admin updates a pharmacy's medicine limit, THE Limit_System SHALL update the limit immediately
3. WHEN a pharmacy's current medicine count exceeds the new limit, THE Limit_System SHALL prevent new additions but keep existing medicines
4. WHEN the Admin views pharmacy details, THE Limit_System SHALL display current medicine count and limit

### Requirement 6: عرض ملاحظات الرفض للصيدلية

**User Story:** As a Pharmacy, I want to view rejection notes for my medicines, so that I can understand what needs to be corrected.

#### Acceptance Criteria

1. WHEN a pharmacy views a rejected medicine, THE Feedback_System SHALL display the rejection notes from Admin
2. WHEN a pharmacy has rejected medicines, THE Feedback_System SHALL highlight them in the medicines list
3. WHEN a pharmacy resubmits a corrected medicine, THE Feedback_System SHALL clear previous rejection notes

### Requirement 7: سجلات المراجعة (Audit Logs)

**User Story:** As an Admin, I want to view audit logs, so that I can track all important actions in the system.

#### Acceptance Criteria

1. WHEN any significant action occurs (pharmacy creation, activation, deactivation, medicine approval, rejection), THE Audit_System SHALL create a log entry with action type, actor ID, target ID, timestamp, and details
2. WHEN the Admin views audit logs, THE Audit_System SHALL display logs with filtering by action type, date range, and actor
3. THE Audit_System SHALL retain logs for a minimum of 1 year
4. THE Audit_System SHALL NOT allow modification or deletion of audit logs

### Requirement 8: لوحة تحكم Admin

**User Story:** As an Admin, I want a comprehensive dashboard, so that I can monitor and manage the entire system efficiently.

#### Acceptance Criteria

1. WHEN the Admin accesses the dashboard, THE Dashboard_System SHALL display summary statistics (total pharmacies, active/inactive count, pending medicines count, approved medicines count)
2. WHEN the Admin views the pharmacies section, THE Dashboard_System SHALL display a searchable, filterable table of all pharmacies
3. WHEN the Admin views the medicines review section, THE Dashboard_System SHALL display pending medicines with quick approve/reject actions
4. WHEN the Admin clicks on a pharmacy, THE Dashboard_System SHALL display pharmacy details including medicine limit, current count, and recent activity

### Requirement 9: إشعارات البريد الإلكتروني (اختياري)

**User Story:** As a Pharmacy, I want to receive email notifications, so that I can stay informed about my medicines' status.

#### Acceptance Criteria

1. WHEN a medicine is approved, THE Notification_System SHALL send approval email to the pharmacy
2. WHEN a medicine is rejected, THE Notification_System SHALL send rejection email with notes to the pharmacy
3. WHEN a pharmacy account status changes, THE Notification_System SHALL send status change email to the pharmacy

### Requirement 10: تصدير البيانات (اختياري)

**User Story:** As an Admin, I want to export data, so that I can generate reports and analyze system data externally.

#### Acceptance Criteria

1. WHEN the Admin requests pharmacy export, THE Export_System SHALL generate CSV file with pharmacy data
2. WHEN the Admin requests medicines export, THE Export_System SHALL generate CSV file with medicines data including status
3. WHEN the Admin requests audit logs export, THE Export_System SHALL generate CSV file with audit log entries
