/**
 * خدمة التصدير
 * Export Service
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { PharmacyAccount, MedicineWithApproval, AuditLog } from '@/types';

/**
 * تحويل البيانات إلى صيغة CSV
 */
function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * تنزيل ملف CSV
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * تصدير الصيدليات إلى CSV
 * Requirement: 10.1
 */
export async function exportPharmacies(pharmacies: PharmacyAccount[]): Promise<void> {
  const headers = [
    'id',
    'name',
    'email',
    'address',
    'city',
    'phoneNumber',
    'ownerName',
    'licenseNumber',
    'status',
    'medicineLimit',
    'currentMedicineCount',
    'rating',
    'totalOrders',
    'createdAt',
  ];
  
  const data = pharmacies.map(pharmacy => ({
    id: pharmacy.id,
    name: pharmacy.name,
    email: pharmacy.email,
    address: pharmacy.address,
    city: pharmacy.city,
    phoneNumber: pharmacy.phoneNumber,
    ownerName: pharmacy.ownerName,
    licenseNumber: pharmacy.licenseNumber,
    status: pharmacy.status,
    medicineLimit: pharmacy.medicineLimit,
    currentMedicineCount: pharmacy.currentMedicineCount,
    rating: pharmacy.rating,
    totalOrders: pharmacy.totalOrders,
    createdAt: pharmacy.createdAt.toISOString(),
  }));
  
  const csv = convertToCSV(data, headers);
  const filename = `pharmacies_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
}

/**
 * تصدير الأدوية إلى CSV
 * Requirement: 10.2
 */
export async function exportMedicines(medicines: MedicineWithApproval[]): Promise<void> {
  const headers = [
    'id',
    'name',
    'code',
    'description',
    'price',
    'quantity',
    'category',
    'manufacturer',
    'pharmacyName',
    'status',
    'rejectionNotes',
    'reviewedBy',
    'reviewedAt',
    'createdAt',
  ];
  
  const data = medicines.map(medicine => ({
    id: medicine.id,
    name: medicine.name,
    code: medicine.code,
    description: medicine.description,
    price: medicine.price,
    quantity: medicine.quantity,
    category: medicine.category,
    manufacturer: medicine.manufacturer,
    pharmacyName: medicine.pharmacyName,
    status: medicine.status,
    rejectionNotes: medicine.rejectionNotes || '',
    reviewedBy: medicine.reviewedBy || '',
    reviewedAt: medicine.reviewedAt ? medicine.reviewedAt.toISOString() : '',
    createdAt: medicine.createdAt.toISOString(),
  }));
  
  const csv = convertToCSV(data, headers);
  const filename = `medicines_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
}

/**
 * تصدير سجلات المراجعة إلى CSV
 * Requirement: 10.3
 */
export async function exportAuditLogs(logs: AuditLog[]): Promise<void> {
  const headers = [
    'id',
    'action',
    'actorEmail',
    'actorRole',
    'targetId',
    'targetType',
    'timestamp',
  ];
  
  const data = logs.map(log => ({
    id: log.id,
    action: log.action,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    targetId: log.targetId,
    targetType: log.targetType,
    timestamp: log.timestamp.toISOString(),
  }));
  
  const csv = convertToCSV(data, headers);
  const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csv, filename);
}

/**
 * تصدير بيانات مخصصة إلى CSV
 */
export async function exportCustomData(
  data: any[],
  headers: string[],
  filename: string
): Promise<void> {
  const csv = convertToCSV(data, headers);
  downloadCSV(csv, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}
