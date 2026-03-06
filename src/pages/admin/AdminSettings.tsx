import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Mail, Phone, Shield, LogOut, Key, Eye, EyeOff, Copy, Check, Trash2, Plus, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  remainingCalls?: number;
  addedAt: Date;
  lastTested?: Date;
  isValid?: boolean;
}

export default function AdminSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // User Settings
  const [emailAlerts, setEmailAlerts] = useState(true);

  // API Keys Management
  const [apiKeysList, setApiKeysList] = useState<ApiKeyItem[]>([]);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Groq API Keys Management
  const [geminiKeysList, setGeminiKeysList] = useState<ApiKeyItem[]>([]);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [newGeminiKeyName, setNewGeminiKeyName] = useState('');
  const [showNewGeminiKey, setShowNewGeminiKey] = useState(false);
  const [isAddingGeminiKey, setIsAddingGeminiKey] = useState(false);
  const [copiedGeminiKeyId, setCopiedGeminiKeyId] = useState<string | null>(null);
  const [visibleGeminiKeys, setVisibleGeminiKeys] = useState<Set<string>>(new Set());
  const [testingGeminiKeys, setTestingGeminiKeys] = useState<Set<string>>(new Set());
  const [geminiKeyToDelete, setGeminiKeyToDelete] = useState<string | null>(null);

  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
      });

      // Load API keys
      loadApiKeys();
      loadGeminiKeys();
    }
  }, [user]);

  const loadGeminiKeys = async () => {
    try {
      const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
      const groqKeysDoc = await getDoc(groqKeysRef);

      if (groqKeysDoc.exists()) {
        const data = groqKeysDoc.data();
        const keysList = data.keysList || [];

        const formattedKeys: ApiKeyItem[] = keysList.map((item: any) => ({
          id: item.id,
          key: item.key,
          name: item.name,
          isActive: item.isActive,
          addedAt: item.addedAt?.toDate() || new Date(),
          lastTested: item.lastTested?.toDate(),
          isValid: item.isValid,
        }));

        setGeminiKeysList(formattedKeys);
      }
    } catch (error) {
      toast.error('فشل تحميل مفاتيح Groq API');
    }
  };

  const loadApiKeys = async () => {
    try {
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      const apiKeysDoc = await getDoc(apiKeysRef);

      if (apiKeysDoc.exists()) {
        const data = apiKeysDoc.data();
        const keysList = data.keysList || [];

        // Convert to ApiKeyItem format
        const formattedKeys: ApiKeyItem[] = keysList.map((item: any) => ({
          id: item.id,
          key: item.key,
          name: item.name,
          isActive: item.isActive,
          remainingCalls: item.remainingCalls,
          addedAt: item.addedAt?.toDate() || new Date(),
          lastTested: item.lastTested?.toDate(),
          isValid: item.isValid,
        }));

        setApiKeysList(formattedKeys);

        // Test active key if exists
        const activeKey = formattedKeys.find(k => k.isActive);
        if (activeKey) {
          setTimeout(() => testApiKey(activeKey.id), 500);
        }
      }
    } catch (error) {
      toast.error('فشل تحميل مفاتيح API');
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.trim()) {
      toast.error('يرجى إدخال مفتاح API');
      return;
    }

    if (!newApiKeyName.trim()) {
      toast.error('يرجى إدخال اسم المفتاح');
      return;
    }

    // Check if key already exists
    if (apiKeysList.some(k => k.key === newApiKey.trim())) {
      toast.error('هذا المفتاح موجود بالفعل');
      return;
    }

    setIsAddingKey(true);

    try {
      const newKey: ApiKeyItem = {
        id: Date.now().toString(),
        key: newApiKey.trim(),
        name: newApiKeyName.trim(),
        isActive: apiKeysList.length === 0, // First key is active by default
        addedAt: new Date(),
      };

      const updatedList = [...apiKeysList, newKey];

      // Save to database
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      await setDoc(apiKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          remainingCalls: k.remainingCalls || null,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        // Keep the old format for backward compatibility
        removeBgApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      setApiKeysList(updatedList);
      setNewApiKey('');
      setNewApiKeyName('');

      toast.success('تم إضافة المفتاح بنجاح');

      // Test the new key
      setTimeout(() => testApiKey(newKey.id), 500);
    } catch (error: any) {
      console.error('Error adding API key:', error);
      toast.error(`فشل إضافة المفتاح: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsAddingKey(false);
    }
  };

  const saveApiKeysList = async (list: ApiKeyItem[]) => {
    try {
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      await setDoc(apiKeysRef, {
        keysList: list.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          remainingCalls: k.remainingCalls || null,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        // Keep the old format for backward compatibility
        removeBgApiKey: list.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });
    } catch (error: any) {
      console.error('Error saving API keys list:', error);
      throw error;
    }
  };

  const testApiKey = async (keyId: string) => {
    const keyIndex = apiKeysList.findIndex(k => k.id === keyId);
    if (keyIndex === -1) return;

    const key = apiKeysList[keyIndex];

    setTestingKeys(prev => new Set(prev).add(keyId));

    try {
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': key.key,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const remainingCalls = data.attributes?.api?.free_calls_remaining || 0;

        const updatedList = [...apiKeysList];
        updatedList[keyIndex] = {
          ...updatedList[keyIndex],
          isValid: true,
          remainingCalls,
          lastTested: new Date(),
        };

        setApiKeysList(updatedList);

        // Save to database
        const apiKeysRef = doc(db, 'system_settings', 'api_keys');
        await setDoc(apiKeysRef, {
          keysList: updatedList.map(k => ({
            id: k.id,
            key: k.key,
            name: k.name,
            isActive: k.isActive,
            remainingCalls: k.remainingCalls || null,
            addedAt: k.addedAt,
            lastTested: k.lastTested || null,
            isValid: k.isValid !== undefined ? k.isValid : null,
          })),
          removeBgApiKey: updatedList.find(k => k.isActive)?.key || '',
          updatedAt: new Date(),
          updatedBy: user?.uid,
        }, { merge: true });

        toast.success(`المفتاح صحيح! متبقي ${remainingCalls} استدعاء`);
      } else {
        const updatedList = [...apiKeysList];
        updatedList[keyIndex] = {
          ...updatedList[keyIndex],
          isValid: false,
          lastTested: new Date(),
        };

        setApiKeysList(updatedList);

        // Save to database
        const apiKeysRef = doc(db, 'system_settings', 'api_keys');
        await setDoc(apiKeysRef, {
          keysList: updatedList.map(k => ({
            id: k.id,
            key: k.key,
            name: k.name,
            isActive: k.isActive,
            remainingCalls: k.remainingCalls || null,
            addedAt: k.addedAt,
            lastTested: k.lastTested || null,
            isValid: k.isValid !== undefined ? k.isValid : null,
          })),
          removeBgApiKey: updatedList.find(k => k.isActive)?.key || '',
          updatedAt: new Date(),
          updatedBy: user?.uid,
        }, { merge: true });

        toast.error('المفتاح غير صحيح أو منتهي الصلاحية');
      }
    } catch (error: any) {
      console.error('Error testing API key:', error);
      toast.error('فشل اختبار المفتاح');
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const handleSetActiveKey = async (keyId: string) => {
    try {
      const updatedList = apiKeysList.map(k => ({
        ...k,
        isActive: k.id === keyId,
      }));

      setApiKeysList(updatedList);

      // Save to database
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      await setDoc(apiKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          remainingCalls: k.remainingCalls || null,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        removeBgApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      toast.success('تم تفعيل المفتاح');
    } catch (error: any) {
      console.error('Error setting active key:', error);
      toast.error('فشل تفعيل المفتاح');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const updatedList = apiKeysList.filter(k => k.id !== keyId);

      // If deleted key was active, activate the first one
      if (apiKeysList.find(k => k.id === keyId)?.isActive && updatedList.length > 0) {
        updatedList[0].isActive = true;
      }

      setApiKeysList(updatedList);

      // Save to database
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      await setDoc(apiKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          remainingCalls: k.remainingCalls || null,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        removeBgApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      toast.success('تم حذف المفتاح');
      setKeyToDelete(null);
    } catch (error: any) {
      console.error('Error deleting key:', error);
      toast.error('فشل حذف المفتاح');
    }
  };

  const handleCopyKey = async (keyId: string, key: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(key);
        setCopiedKeyId(keyId);
        toast.success('تم نسخ المفتاح');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = key;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedKeyId(keyId);
            toast.success('تم نسخ المفتاح');
          } else {
            toast.error('فشل نسخ المفتاح');
          }
        } catch (err) {
          toast.error('فشل نسخ المفتاح');
        }

        document.body.removeChild(textArea);
      }

      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('فشل نسخ المفتاح');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  // Groq API Keys Functions
  const handleAddGeminiKey = async () => {
    if (!newGeminiKey.trim()) {
      toast.error('يرجى إدخال مفتاح Groq API');
      return;
    }

    if (!newGeminiKeyName.trim()) {
      toast.error('يرجى إدخال اسم المفتاح');
      return;
    }

    if (geminiKeysList.some(k => k.key === newGeminiKey.trim())) {
      toast.error('هذا المفتاح موجود بالفعل');
      return;
    }

    setIsAddingGeminiKey(true);

    try {
      const newKey: ApiKeyItem = {
        id: Date.now().toString(),
        key: newGeminiKey.trim(),
        name: newGeminiKeyName.trim(),
        isActive: geminiKeysList.length === 0,
        addedAt: new Date(),
      };

      const updatedList = [...geminiKeysList, newKey];

      const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
      await setDoc(groqKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        groqApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      setGeminiKeysList(updatedList);
      setNewGeminiKey('');
      setNewGeminiKeyName('');

      toast.success('تم إضافة مفتاح Groq بنجاح');
      setTimeout(() => testGeminiKey(newKey.id), 500);
    } catch (error: any) {
      console.error('Error adding Groq key:', error);
      toast.error(`فشل إضافة المفتاح: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsAddingGeminiKey(false);
    }
  };

  const testGeminiKey = async (keyId: string) => {
    const keyIndex = geminiKeysList.findIndex(k => k.id === keyId);
    if (keyIndex === -1) return;

    const key = geminiKeysList[keyIndex];
    setTestingGeminiKeys(prev => new Set(prev).add(keyId));

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      let isValid = false;
      let errorMessage = '';

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          isValid = true;
        } else {
          errorMessage = 'استجابة غير صحيحة من API';
        }
      } else {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || 'المفتاح غير صحيح';
      }

      const updatedList = [...geminiKeysList];
      updatedList[keyIndex] = {
        ...updatedList[keyIndex],
        isValid,
        lastTested: new Date(),
      };

      setGeminiKeysList(updatedList);

      const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
      await setDoc(groqKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        groqApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      if (isValid) {
        toast.success('✅ المفتاح صحيح ويعمل بنجاح!');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error testing Groq key:', error);
      
      const updatedList = [...geminiKeysList];
      updatedList[keyIndex] = {
        ...updatedList[keyIndex],
        isValid: false,
        lastTested: new Date(),
      };
      setGeminiKeysList(updatedList);

      toast.error('فشل اختبار المفتاح: ' + (error.message || 'خطأ في الاتصال'));
    } finally {
      setTestingGeminiKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const handleSetActiveGeminiKey = async (keyId: string) => {
    try {
      const updatedList = geminiKeysList.map(k => ({
        ...k,
        isActive: k.id === keyId,
      }));

      setGeminiKeysList(updatedList);

      const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
      await setDoc(groqKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        groqApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      toast.success('تم تفعيل المفتاح');
    } catch (error: any) {
      console.error('Error setting active Groq key:', error);
      toast.error('فشل تفعيل المفتاح');
    }
  };

  const handleDeleteGeminiKey = async (keyId: string) => {
    try {
      const updatedList = geminiKeysList.filter(k => k.id !== keyId);

      if (geminiKeysList.find(k => k.id === keyId)?.isActive && updatedList.length > 0) {
        updatedList[0].isActive = true;
      }

      setGeminiKeysList(updatedList);

      const groqKeysRef = doc(db, 'system_settings', 'groq_api_keys');
      await setDoc(groqKeysRef, {
        keysList: updatedList.map(k => ({
          id: k.id,
          key: k.key,
          name: k.name,
          isActive: k.isActive,
          addedAt: k.addedAt,
          lastTested: k.lastTested || null,
          isValid: k.isValid !== undefined ? k.isValid : null,
        })),
        groqApiKey: updatedList.find(k => k.isActive)?.key || '',
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });

      toast.success('تم حذف المفتاح');
      setGeminiKeyToDelete(null);
    } catch (error: any) {
      console.error('Error deleting Groq key:', error);
      toast.error('فشل حذف المفتاح');
    }
  };

  const toggleGeminiKeyVisibility = (keyId: string) => {
    setVisibleGeminiKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const handleCopyGeminiKey = async (keyId: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(key);
        setCopiedGeminiKeyId(keyId);
        toast.success('تم نسخ المفتاح');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = key;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedGeminiKeyId(keyId);
        toast.success('تم نسخ المفتاح');
      }
      setTimeout(() => setCopiedGeminiKeyId(null), 2000);
    } catch (error) {
      toast.error('فشل نسخ المفتاح');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phoneNumber: profileData.phone,
      });

      // Refresh user data
      await refreshUser();

      toast.success('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('فشل حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('فشل تسجيل الخروج');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-primary text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cairo">الإعدادات</h1>
              <p className="text-muted-foreground">إدارة إعدادات النظام والتفضيلات</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <User className="w-5 h-5 text-primary" />
                الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-cairo">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-cairo font-medium">مدير النظام</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    className="font-cairo"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="font-cairo bg-muted"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                    className="font-cairo"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    الدور
                  </Label>
                  <Input
                    value="مدير النظام"
                    disabled
                    className="font-cairo bg-muted"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="font-cairo"
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 font-cairo">
                    <Key className="w-5 h-5 text-primary" />
                    إدارة مفاتيح API
                  </CardTitle>
                  <CardDescription className="font-cairo mt-1">
                    قم بإضافة وإدارة مفاتيح Remove.bg API الخاصة بك
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-cairo">
                  {apiKeysList.length} مفتاح
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Key Section */}
              <div className="p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-cairo font-semibold">إضافة مفتاح جديد</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-cairo">
                      اسم المفتاح <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="مثال: حساب شخصي، حساب العمل..."
                      className="font-cairo"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo">
                      مفتاح API <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewApiKey ? "text" : "password"}
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="أدخل مفتاح Remove.bg API"
                        className="font-mono pl-12"
                        dir="ltr"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-0 bottom-0 my-auto h-8 w-8 p-0"
                        onClick={() => setShowNewApiKey(!showNewApiKey)}
                      >
                        {showNewApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    احصل على مفتاح مجاني من{' '}
                    <a
                      href="https://www.remove.bg/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      remove.bg
                    </a>
                  </p>
                  <Button
                    onClick={handleAddApiKey}
                    disabled={isAddingKey || !newApiKey.trim() || !newApiKeyName.trim()}
                    className="font-cairo"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {isAddingKey ? 'جاري الإضافة...' : 'إضافة المفتاح'}
                  </Button>
                </div>
              </div>

              {/* API Keys List */}
              {apiKeysList.length > 0 && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-cairo font-semibold text-sm text-muted-foreground">
                      المفاتيح المحفوظة ({apiKeysList.length})
                    </h3>

                    {/* Scrollable Container */}
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                      <AnimatePresence mode="popLayout">
                        {apiKeysList.map((keyItem) => (
                          <motion.div
                            key={keyItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-4 rounded-lg border-2 transition-all ${keyItem.isActive
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30'
                              }`}
                          >
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-cairo font-semibold truncate">
                                      {keyItem.name}
                                    </h4>
                                    {keyItem.isActive && (
                                      <Badge className="bg-primary text-white font-cairo text-xs">
                                        نشط
                                      </Badge>
                                    )}
                                    {keyItem.isValid !== undefined && (
                                      <Badge
                                        variant={keyItem.isValid ? "default" : "destructive"}
                                        className="font-cairo text-xs"
                                      >
                                        {keyItem.isValid ? '✓ صحيح' : '✗ غير صحيح'}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Key Display */}
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                                      {visibleKeys.has(keyItem.id)
                                        ? keyItem.key
                                        : '•'.repeat(Math.min(keyItem.key.length, 32))
                                      }
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => toggleKeyVisibility(keyItem.id)}
                                    >
                                      {visibleKeys.has(keyItem.id) ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCopyKey(keyItem.id, keyItem.key)}
                                    >
                                      {copiedKeyId === keyItem.id ? (
                                        <Check className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  </div>

                                  {/* Info */}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>
                                      أضيف: {keyItem.addedAt.toLocaleDateString('ar-EG')}
                                    </span>
                                    {keyItem.remainingCalls !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <span className={keyItem.remainingCalls <= 10 ? 'text-destructive font-medium' : ''}>
                                          {keyItem.remainingCalls} استدعاء متبقي
                                        </span>
                                      </span>
                                    )}
                                    {keyItem.lastTested && (
                                      <span>
                                        آخر اختبار: {keyItem.lastTested.toLocaleTimeString('ar-EG', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => testApiKey(keyItem.id)}
                                    disabled={testingKeys.has(keyItem.id)}
                                    className="h-8 font-cairo"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ml-1 ${testingKeys.has(keyItem.id) ? 'animate-spin' : ''}`} />
                                    {testingKeys.has(keyItem.id) ? 'جاري الاختبار...' : 'اختبار'}
                                  </Button>

                                  {!keyItem.isActive && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetActiveKey(keyItem.id)}
                                      className="h-8 font-cairo"
                                    >
                                      تفعيل
                                    </Button>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setKeyToDelete(keyItem.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}

              {/* Tips */}
              {apiKeysList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-cairo">لا توجد مفاتيح محفوظة</p>
                  <p className="text-sm mt-1">قم بإضافة مفتاح API للبدء</p>
                </div>
              )}

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-cairo font-medium text-sm mb-2 flex items-center gap-2">
                  💡 نصائح مهمة:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>كل حساب مجاني يحصل على 50 صورة شهرياً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>يمكنك إضافة عدة مفاتيح والتبديل بينها</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>المفتاح النشط هو المستخدم حالياً في النظام</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>اختبر المفاتيح بانتظام للتأكد من صلاحيتها</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Key Confirmation Dialog */}
        <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-xl">تأكيد حذف المفتاح</AlertDialogTitle>
              <AlertDialogDescription className="font-cairo text-base">
                هل أنت متأكد من حذف هذا المفتاح؟
                <br />
                لن تتمكن من استرجاعه بعد الحذف.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => keyToDelete && handleDeleteKey(keyToDelete)}
                className="bg-destructive hover:bg-destructive/90 font-cairo"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف المفتاح
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Gemini API Keys Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 font-cairo">
                    <Key className="w-5 h-5 text-purple-600" />
                    إدارة مفاتيح Groq AI
                  </CardTitle>
                  <CardDescription className="font-cairo mt-1">
                    قم بإضافة وإدارة مفاتيح Groq API للذكاء الاصطناعي (مجاني وسريع جداً)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-cairo bg-purple-50 text-purple-700 border-purple-200">
                  {geminiKeysList.length} مفتاح
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Hugging Face Key Section */}
              <div className="p-4 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/50 space-y-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-cairo font-semibold">إضافة مفتاح Hugging Face جديد</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-cairo">
                      اسم المفتاح <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newGeminiKeyName}
                      onChange={(e) => setNewGeminiKeyName(e.target.value)}
                      placeholder="مثال: حساب شخصي، حساب العمل..."
                      className="font-cairo"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo">
                      مفتاح Hugging Face API <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewGeminiKey ? "text" : "password"}
                        value={newGeminiKey}
                        onChange={(e) => setNewGeminiKey(e.target.value)}
                        placeholder="أدخل مفتاح Hugging Face API"
                        className="font-mono pl-12"
                        dir="ltr"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-0 bottom-0 my-auto h-8 w-8 p-0"
                        onClick={() => setShowNewGeminiKey(!showNewGeminiKey)}
                      >
                        {showNewGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    احصل على مفتاح مجاني من{' '}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline font-medium"
                    >
                      Google AI Studio
                    </a>
                  </p>
                  <Button
                    onClick={handleAddGeminiKey}
                    disabled={isAddingGeminiKey || !newGeminiKey.trim() || !newGeminiKeyName.trim()}
                    className="font-cairo bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {isAddingGeminiKey ? 'جاري الإضافة...' : 'إضافة المفتاح'}
                  </Button>
                </div>
              </div>

              {/* Gemini Keys List */}
              {geminiKeysList.length > 0 && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-cairo font-semibold text-sm text-muted-foreground">
                      المفاتيح المحفوظة ({geminiKeysList.length})
                    </h3>

                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                      <AnimatePresence mode="popLayout">
                        {geminiKeysList.map((keyItem) => (
                          <motion.div
                            key={keyItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-4 rounded-lg border-2 transition-all ${keyItem.isActive
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'border-border bg-card hover:border-purple-300'
                              }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-cairo font-semibold truncate">
                                      {keyItem.name}
                                    </h4>
                                    {keyItem.isActive && (
                                      <Badge className="bg-purple-600 text-white font-cairo text-xs">
                                        نشط
                                      </Badge>
                                    )}
                                    {keyItem.isValid !== undefined && (
                                      <Badge
                                        variant={keyItem.isValid ? "default" : "destructive"}
                                        className="font-cairo text-xs"
                                      >
                                        {keyItem.isValid ? '✓ صحيح' : '✗ غير صحيح'}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                                      {visibleGeminiKeys.has(keyItem.id)
                                        ? keyItem.key
                                        : '•'.repeat(Math.min(keyItem.key.length, 32))
                                      }
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => toggleGeminiKeyVisibility(keyItem.id)}
                                    >
                                      {visibleGeminiKeys.has(keyItem.id) ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleCopyGeminiKey(keyItem.id, keyItem.key)}
                                    >
                                      {copiedGeminiKeyId === keyItem.id ? (
                                        <Check className="w-3.5 h-3.5 text-success" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>
                                      أضيف: {keyItem.addedAt.toLocaleDateString('ar-EG')}
                                    </span>
                                    {keyItem.lastTested && (
                                      <span>
                                        آخر اختبار: {keyItem.lastTested.toLocaleTimeString('ar-EG', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => testGeminiKey(keyItem.id)}
                                    disabled={testingGeminiKeys.has(keyItem.id)}
                                    className="h-8 font-cairo"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ml-1 ${testingGeminiKeys.has(keyItem.id) ? 'animate-spin' : ''}`} />
                                    {testingGeminiKeys.has(keyItem.id) ? 'جاري الاختبار...' : 'اختبار'}
                                  </Button>

                                  {!keyItem.isActive && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetActiveGeminiKey(keyItem.id)}
                                      className="h-8 font-cairo"
                                    >
                                      تفعيل
                                    </Button>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setGeminiKeyToDelete(keyItem.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}

              {geminiKeysList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-cairo">لا توجد مفاتيح محفوظة</p>
                  <p className="text-sm mt-1">قم بإضافة مفتاح Groq API للبدء</p>
                </div>
              )}

              <Separator />

              <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                <p className="font-cairo font-medium text-sm mb-2 flex items-center gap-2 text-purple-700">
                  ✨ معلومات Groq AI:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>مجاني تماماً وسريع جداً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>يستخدم لتوليد أسماء وأوصاف الأدوية تلقائياً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>يمكنك إضافة عدة مفاتيح والتبديل بينها</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>المفتاح النشط هو المستخدم في توليد البيانات</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Groq Key Dialog */}
        <AlertDialog open={!!geminiKeyToDelete} onOpenChange={() => setGeminiKeyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-xl">تأكيد حذف المفتاح</AlertDialogTitle>
              <AlertDialogDescription className="font-cairo text-base">
                هل أنت متأكد من حذف هذا المفتاح؟
                <br />
                لن تتمكن من استرجاعه بعد الحذف.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => geminiKeyToDelete && handleDeleteGeminiKey(geminiKeyToDelete)}
                className="bg-destructive hover:bg-destructive/90 font-cairo"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف المفتاح
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <Settings className="w-5 h-5 text-primary" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">إصدار النظام</p>
                  <p className="font-cairo font-semibold">v1.0.0</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">آخر تحديث</p>
                  <p className="font-cairo font-semibold">يناير 2026</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">حالة النظام</p>
                  <p className="font-cairo font-semibold text-success">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo text-destructive">
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-cairo font-medium mb-1">الخروج من الحساب</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم تسجيل خروجك من النظام وإعادتك لصفحة تسجيل الدخول
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowLogoutDialog(true)}
                  className="font-cairo"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-xl">تأكيد تسجيل الخروج</AlertDialogTitle>
              <AlertDialogDescription className="font-cairo text-base">
                هل أنت متأكد من تسجيل الخروج من حسابك؟
                <br />
                سيتم إعادتك إلى صفحة تسجيل الدخول.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 font-cairo"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
