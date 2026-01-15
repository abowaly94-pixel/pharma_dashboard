/**
 * أنواع الأخطاء المخصصة لنظام إدارة الصيدليات
 * Custom error types for the pharmacy management system
 */

// ==================== Authentication Errors ====================

/** أكواد أخطاء المصادقة */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE'
  | 'ACCOUNT_SUSPENDED'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'EMAIL_NOT_VERIFIED';

/** خطأ المصادقة */
export class AuthenticationError extends Error {
  public readonly code: AuthErrorCode;
  public readonly statusCode: number;

  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.statusCode = this.getStatusCode(code);
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }

  private getStatusCode(code: AuthErrorCode): number {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return 401;
      case 'ACCOUNT_LOCKED':
      case 'ACCOUNT_INACTIVE':
      case 'ACCOUNT_SUSPENDED':
        return 403;
      case 'SESSION_EXPIRED':
      case 'SESSION_INVALID':
        return 401;
      case 'EMAIL_NOT_VERIFIED':
        return 403;
      default:
        return 401;
    }
  }

  /** الحصول على رسالة الخطأ بالعربية */
  getArabicMessage(): string {
    switch (this.code) {
      case 'INVALID_CREDENTIALS':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      case 'ACCOUNT_LOCKED':
        return 'تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة';
      case 'ACCOUNT_INACTIVE':
        return 'الحساب غير مفعل. يرجى التواصل مع الإدارة';
      case 'ACCOUNT_SUSPENDED':
        return 'تم تعليق الحساب. يرجى التواصل مع الإدارة';
      case 'SESSION_EXPIRED':
        return 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
      case 'SESSION_INVALID':
        return 'جلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى';
      case 'EMAIL_NOT_VERIFIED':
        return 'يرجى تأكيد البريد الإلكتروني أولاً';
      default:
        return 'حدث خطأ في المصادقة';
    }
  }
}

// ==================== Authorization Errors ====================

/** أكواد أخطاء الصلاحيات */
export type AuthorizationErrorCode =
  | 'INSUFFICIENT_PERMISSIONS'
  | 'MEDICINE_LIMIT_REACHED'
  | 'EDIT_NOT_ALLOWED'
  | 'ACTION_NOT_ALLOWED'
  | 'RESOURCE_NOT_OWNED';

/** خطأ الصلاحيات */
export class AuthorizationError extends Error {
  public readonly code: AuthorizationErrorCode;
  public readonly statusCode: number = 403;

  constructor(message: string, code: AuthorizationErrorCode) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }

  /** الحصول على رسالة الخطأ بالعربية */
  getArabicMessage(): string {
    switch (this.code) {
      case 'INSUFFICIENT_PERMISSIONS':
        return 'ليس لديك صلاحية للقيام بهذا الإجراء';
      case 'MEDICINE_LIMIT_REACHED':
        return 'تم الوصول للحد الأقصى من الأدوية المسموح بها';
      case 'EDIT_NOT_ALLOWED':
        return 'لا يمكن تعديل هذا العنصر';
      case 'ACTION_NOT_ALLOWED':
        return 'هذا الإجراء غير مسموح به';
      case 'RESOURCE_NOT_OWNED':
        return 'لا يمكنك الوصول لهذا المورد';
      default:
        return 'ليس لديك صلاحية للقيام بهذا الإجراء';
    }
  }
}

// ==================== Validation Errors ====================

/** أكواد أخطاء التحقق */
export type ValidationErrorCode =
  | 'REQUIRED'
  | 'INVALID_FORMAT'
  | 'DUPLICATE'
  | 'OUT_OF_RANGE'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'INVALID_PHONE'
  | 'INVALID_DATE';

/** خطأ التحقق من البيانات */
export class ValidationError extends Error {
  public readonly code: ValidationErrorCode;
  public readonly field: string;
  public readonly statusCode: number = 400;

  constructor(message: string, field: string, code: ValidationErrorCode) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /** الحصول على رسالة الخطأ بالعربية */
  getArabicMessage(): string {
    const fieldNames: Record<string, string> = {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      phoneNumber: 'رقم الهاتف',
      address: 'العنوان',
      city: 'المدينة',
      ownerName: 'اسم المالك',
      licenseNumber: 'رقم الترخيص',
      price: 'السعر',
      quantity: 'الكمية',
      code: 'الكود',
      description: 'الوصف',
      category: 'الفئة',
      manufacturer: 'الشركة المصنعة',
      expiryDate: 'تاريخ الانتهاء',
    };

    const fieldName = fieldNames[this.field] || this.field;

    switch (this.code) {
      case 'REQUIRED':
        return `${fieldName} مطلوب`;
      case 'INVALID_FORMAT':
        return `صيغة ${fieldName} غير صحيحة`;
      case 'DUPLICATE':
        return `${fieldName} موجود مسبقاً`;
      case 'OUT_OF_RANGE':
        return `${fieldName} خارج النطاق المسموح`;
      case 'INVALID_EMAIL':
        return 'البريد الإلكتروني غير صالح';
      case 'WEAK_PASSWORD':
        return 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل';
      case 'INVALID_PHONE':
        return 'رقم الهاتف غير صالح';
      case 'INVALID_DATE':
        return 'التاريخ غير صالح';
      default:
        return `خطأ في ${fieldName}`;
    }
  }
}

// ==================== Not Found Error ====================

/** خطأ عدم العثور على المورد */
export class NotFoundError extends Error {
  public readonly resourceType: string;
  public readonly resourceId: string;
  public readonly statusCode: number = 404;

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} with id ${resourceId} not found`);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }

  /** الحصول على رسالة الخطأ بالعربية */
  getArabicMessage(): string {
    const resourceNames: Record<string, string> = {
      pharmacy: 'الصيدلية',
      medicine: 'الدواء',
      user: 'المستخدم',
      order: 'الطلب',
      auditLog: 'سجل المراجعة',
    };

    const resourceName = resourceNames[this.resourceType] || this.resourceType;
    return `لم يتم العثور على ${resourceName}`;
  }
}

// ==================== Database Error ====================

/** خطأ قاعدة البيانات */
export class DatabaseError extends Error {
  public readonly operation: string;
  public readonly originalError?: Error;
  public readonly statusCode: number = 500;

  constructor(message: string, operation: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  /** الحصول على رسالة الخطأ بالعربية */
  getArabicMessage(): string {
    return 'حدث خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى';
  }
}

// ==================== Helper Functions ====================

/** التحقق من نوع الخطأ */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/** الحصول على رسالة الخطأ بالعربية من أي نوع خطأ */
export function getArabicErrorMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    return error.getArabicMessage();
  }
  if (isAuthorizationError(error)) {
    return error.getArabicMessage();
  }
  if (isValidationError(error)) {
    return error.getArabicMessage();
  }
  if (isNotFoundError(error)) {
    return error.getArabicMessage();
  }
  if (isDatabaseError(error)) {
    return error.getArabicMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'حدث خطأ غير متوقع';
}
