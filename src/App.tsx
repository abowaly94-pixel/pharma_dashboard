import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Component, type ReactNode } from "react";
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";
// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPharmacies from "./pages/admin/AdminPharmacies";
import AdminMedicineReview from "./pages/admin/AdminMedicineReview";
import AdminSettings from "./pages/admin/AdminSettings";
import PharmacistDashboard from "./pages/pharmacist/PharmacistDashboard";
import PharmacistMedicines from "./pages/pharmacist/PharmacistMedicines";
import PharmacistOrders from "./pages/pharmacist/PharmacistOrders";
import PharmacistSettings from "./pages/pharmacist/PharmacistSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error('App crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
          <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-card p-6">
            <h1 className="text-2xl font-bold font-cairo mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground font-cairo mb-6">
              حصلت مشكلة أثناء عرض الصفحة. جرب إعادة تحميل الصفحة أو الرجوع لتسجيل الدخول.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-cairo"
              >
                إعادة تحميل
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/login')}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 font-cairo"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotificationPermissionPrompt />
            <AppErrorBoundary>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/medicines"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminMedicines />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminNotifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/pharmacies"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminPharmacies />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/medicine-review"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminMedicineReview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Pharmacist Routes */}
                  <Route
                    path="/pharmacist"
                    element={
                      <ProtectedRoute requiredRole="pharmacist">
                        <PharmacistDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pharmacist/medicines"
                    element={
                      <ProtectedRoute requiredRole="pharmacist">
                        <PharmacistMedicines />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pharmacist/orders"
                    element={
                      <ProtectedRoute requiredRole="pharmacist">
                        <PharmacistOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pharmacist/settings"
                    element={
                      <ProtectedRoute requiredRole="pharmacist">
                        <PharmacistSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch All */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AppErrorBoundary>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
