import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMedicines from "./pages/admin/AdminMedicines";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import PharmacistDashboard from "./pages/pharmacist/PharmacistDashboard";
import PharmacistMedicines from "./pages/pharmacist/PharmacistMedicines";
import PharmacistOrders from "./pages/pharmacist/PharmacistOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
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
                  <PharmacistDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
