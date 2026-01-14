import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        toast.success('تم تسجيل الدخول بنجاح');

        // Dynamic redirection based on role from Firestore
        if (loggedInUser.role === 'admin') {
          navigate('/admin');
        } else if (loggedInUser.role === 'pharmacist') {
          navigate('/pharmacist');
        } else {
          toast.error('هذا الحساب لا يملك صلاحيات الوصول للوحة التحكم');
        }
      } else {
        toast.error('بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background" dir="rtl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Pill className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cairo">PharmaNow</h1>
              <p className="text-sm text-muted-foreground">لوحة التحكم</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-cairo mb-2">مرحباً بعودتك</h2>
            <p className="text-muted-foreground">
              سجل دخولك للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-cairo">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your account"
                  className="pr-10 text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-cairo">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 pl-10 text-left"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-cairo h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-muted rounded-xl">
            <p className="text-sm font-medium font-cairo mb-3">بيانات تجريبية للدخول:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">أدمن:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">admin@test.com</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">صيدلي:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">pharmacist@test.com</code>
              </div>
              <div className="text-center pt-2 border-t border-border">
                <span className="text-muted-foreground">كلمة المرور: </span>
                <code className="text-xs bg-background px-2 py-1 rounded">123456</code>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center max-w-lg"
        >
          <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
            <Pill className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white font-cairo mb-4">
            PharmaNow Dashboard
          </h2>
          <p className="text-white/80 text-lg leading-relaxed font-cairo">
            نظام إدارة متكامل للصيدليات والأدوية النادرة
            <br />
            إدارة سهلة وفعالة لجميع العمليات
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {['إدارة الأدوية', 'تتبع الطلبات', 'تحليلات متقدمة', 'دعم متعدد الصيدليات'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-cairo"
              >
                {feature}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
