import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'pharmacist' | 'nurse';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isPharmacist, isNurse } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-cairo">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    if (isPharmacist) return <Navigate to="/pharmacist" replace />;
    if (isNurse) return <Navigate to="/nurse" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'pharmacist' && !isPharmacist && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'nurse' && !isNurse && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
