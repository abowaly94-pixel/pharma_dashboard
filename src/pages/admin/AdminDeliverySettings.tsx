import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Zap, Clock, Save, RotateCcw, Info } from 'lucide-react';
import { getDeliverySettings, updateDeliverySettings } from '@/services/deliverySettingsService';
import { DeliverySettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminDeliverySettings() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
    const [originalSettings, setOriginalSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getDeliverySettings();
            setSettings(data);
            setOriginalSettings(data);
        } catch {
            toast({ title: 'خطأ في جلب البيانات', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (settings.expressPrice <= 0 || settings.standardPrice <= 0) {
            toast({ title: 'يجب أن تكون الأسعار أكبر من صفر', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            await updateDeliverySettings(settings, user?.uid || 'admin');
            setOriginalSettings({ ...settings });
            toast({ title: '✅ تم الحفظ بنجاح', description: 'سيتم تطبيق التغييرات فوراً على التطبيق' });
        } catch {
            toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof DeliverySettings, value: string | number) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Truck className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-cairo">إعدادات التوصيل</h1>
                        <p className="text-muted-foreground font-cairo text-sm">
                            تحكّم في أسعار ونصوص خيارات التوصيل التي تظهر للعملاء
                        </p>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-cairo text-blue-700 dark:text-blue-300">
                        كل تغيير يُطبَّق فوراً على التطبيق بدون تحديث.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {/* Express Delivery */}
                        <Card className="border-2 hover:border-orange-300 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-cairo">التوصيل السريع</CardTitle>
                                        <CardDescription className="font-cairo">15-30 دقيقة</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Price */}
                                <div className="md:col-span-2">
                                    <Label className="font-cairo text-sm font-semibold mb-1.5 block">💰 السعر (ج.م)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number" min="0" step="1"
                                            value={settings.expressPrice}
                                            onChange={(e) => set('expressPrice', Number(e.target.value))}
                                            className="font-cairo text-lg font-bold pl-14 h-11"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-cairo text-sm">ج.م</span>
                                    </div>
                                </div>
                                {/* Arabic Texts */}
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇪🇬 العنوان (عربي)</Label>
                                    <Input value={settings.expressTitleAr} onChange={(e) => set('expressTitleAr', e.target.value)} className="font-cairo" placeholder="توصيل سريع" dir="rtl" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇬🇧 العنوان (إنجليزي)</Label>
                                    <Input value={settings.expressTitleEn} onChange={(e) => set('expressTitleEn', e.target.value)} placeholder="Express Delivery" dir="ltr" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇪🇬 الوصف (عربي)</Label>
                                    <Input value={settings.expressSubtitleAr} onChange={(e) => set('expressSubtitleAr', e.target.value)} className="font-cairo" placeholder="استلم طلبك خلال 15-30 دقيقة" dir="rtl" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇬🇧 الوصف (إنجليزي)</Label>
                                    <Input value={settings.expressSubtitleEn} onChange={(e) => set('expressSubtitleEn', e.target.value)} placeholder="Receive in 15-30 minutes" dir="ltr" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Standard Delivery */}
                        <Card className="border-2 hover:border-blue-300 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-cairo">التوصيل العادي</CardTitle>
                                        <CardDescription className="font-cairo">1-2 ساعة</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Price */}
                                <div className="md:col-span-2">
                                    <Label className="font-cairo text-sm font-semibold mb-1.5 block">💰 السعر (ج.م)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number" min="0" step="1"
                                            value={settings.standardPrice}
                                            onChange={(e) => set('standardPrice', Number(e.target.value))}
                                            className="font-cairo text-lg font-bold pl-14 h-11"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-cairo text-sm">ج.م</span>
                                    </div>
                                </div>
                                {/* Texts */}
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇪🇬 العنوان (عربي)</Label>
                                    <Input value={settings.standardTitleAr} onChange={(e) => set('standardTitleAr', e.target.value)} className="font-cairo" placeholder="توصيل عادي" dir="rtl" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇬🇧 العنوان (إنجليزي)</Label>
                                    <Input value={settings.standardTitleEn} onChange={(e) => set('standardTitleEn', e.target.value)} placeholder="Standard Delivery" dir="ltr" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇪🇬 الوصف (عربي)</Label>
                                    <Input value={settings.standardSubtitleAr} onChange={(e) => set('standardSubtitleAr', e.target.value)} className="font-cairo" placeholder="استلم طلبك خلال 1-2 ساعة" dir="rtl" />
                                </div>
                                <div>
                                    <Label className="font-cairo text-sm mb-1.5 block">🇬🇧 الوصف (إنجليزي)</Label>
                                    <Input value={settings.standardSubtitleEn} onChange={(e) => set('standardSubtitleEn', e.target.value)} placeholder="Receive in 1-2 hours" dir="ltr" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Actions */}
                {!loading && (
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setSettings({ ...originalSettings })} disabled={!hasChanges || saving} className="font-cairo gap-2">
                            <RotateCcw className="w-4 h-4" />
                            تراجع
                        </Button>
                        <Button onClick={handleSave} disabled={!hasChanges || saving} className="font-cairo gap-2 min-w-36">
                            {saving
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Save className="w-4 h-4" />}
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
