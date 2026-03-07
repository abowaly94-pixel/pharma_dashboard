/**
 * خدمة إعدادات التوصيل
 * Delivery Settings Service
 *
 * تتيح للأدمن التحكم في أسعار ونصوص الخيارات من لوحة التحكم
 * تُخزّن البيانات في: delivery_settings/config (Firestore)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DeliverySettings } from '@/types';

const COLLECTION = 'delivery_settings';
const DOC_ID = 'config';

/** القيم الافتراضية */
const DEFAULT_SETTINGS: DeliverySettings = {
    expressPrice: 25,
    standardPrice: 15,
    expressTitleAr: 'توصيل سريع',
    expressSubtitleAr: 'استلم طلبك خلال 15-30 دقيقة',
    standardTitleAr: 'توصيل عادي',
    standardSubtitleAr: 'استلم طلبك خلال 1-2 ساعة',
    expressTitleEn: 'Express Delivery',
    expressSubtitleEn: 'Receive your order in 15-30 minutes',
    standardTitleEn: 'Standard Delivery',
    standardSubtitleEn: 'Receive your order in 1-2 hours',
};

/**
 * جلب إعدادات التوصيل من Firestore
 */
export async function getDeliverySettings(): Promise<DeliverySettings> {
    try {
        const docRef = doc(db, COLLECTION, DOC_ID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await setDoc(docRef, {
                ...DEFAULT_SETTINGS,
                updatedAt: serverTimestamp(),
                updatedBy: 'system',
            });
            return DEFAULT_SETTINGS;
        }

        const d = docSnap.data();
        return {
            expressPrice: (d.expressPrice as number) ?? DEFAULT_SETTINGS.expressPrice,
            standardPrice: (d.standardPrice as number) ?? DEFAULT_SETTINGS.standardPrice,
            expressTitleAr: (d.expressTitleAr as string) || DEFAULT_SETTINGS.expressTitleAr,
            expressSubtitleAr: (d.expressSubtitleAr as string) || DEFAULT_SETTINGS.expressSubtitleAr,
            standardTitleAr: (d.standardTitleAr as string) || DEFAULT_SETTINGS.standardTitleAr,
            standardSubtitleAr: (d.standardSubtitleAr as string) || DEFAULT_SETTINGS.standardSubtitleAr,
            expressTitleEn: (d.expressTitleEn as string) || DEFAULT_SETTINGS.expressTitleEn,
            expressSubtitleEn: (d.expressSubtitleEn as string) || DEFAULT_SETTINGS.expressSubtitleEn,
            standardTitleEn: (d.standardTitleEn as string) || DEFAULT_SETTINGS.standardTitleEn,
            standardSubtitleEn: (d.standardSubtitleEn as string) || DEFAULT_SETTINGS.standardSubtitleEn,
        };
    } catch (error) {
        console.error('Error fetching delivery settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * تحديث إعدادات التوصيل في Firestore
 */
export async function updateDeliverySettings(
    settings: DeliverySettings,
    updatedBy: string
): Promise<void> {
    if (settings.expressPrice < 0 || settings.standardPrice < 0) {
        throw new Error('أسعار التوصيل يجب أن تكون أرقاماً موجبة');
    }

    const docRef = doc(db, COLLECTION, DOC_ID);
    await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy,
    });
}
