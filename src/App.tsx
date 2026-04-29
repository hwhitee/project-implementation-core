import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import AlertForm from "./pages/AlertForm";
import Response from "./pages/Response";
import Weather from "./pages/Weather";
import EmergencyCalls from "./pages/EmergencyCalls";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import AdminHome from "./pages/admin/AdminHome";
import AdminAlertList from "./pages/admin/AdminAlertList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RoleHome = () => {
  const { role } = useAuth();
  return role === "admin" ? <Navigate to="/admin" replace /> : <Home />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route path="/" element={<ProtectedRoute><RoleHome /></ProtectedRoute>} />
            <Route path="/alerts/yellow" element={<ProtectedRoute><AlertForm type="yellow" /></ProtectedRoute>} />
            <Route path="/alerts/red" element={<ProtectedRoute><AlertForm type="red" /></ProtectedRoute>} />
            <Route path="/alerts/women" element={<ProtectedRoute><AlertForm type="women" /></ProtectedRoute>} />
            <Route path="/response" element={<ProtectedRoute><Response /></ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
            <Route path="/emergency-calls" element={<ProtectedRoute><EmergencyCalls /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminHome /></ProtectedRoute>} />
            <Route path="/admin/yellow" element={<ProtectedRoute requireAdmin><AdminAlertList type="yellow" title="Yellow Alerts" /></ProtectedRoute>} />
            <Route path="/admin/red" element={<ProtectedRoute requireAdmin><AdminAlertList type="red" title="Red Alerts" /></ProtectedRoute>} />
            <Route path="/admin/women" element={<ProtectedRoute requireAdmin><AdminAlertList type="women" title="Women Safety SOS" /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Toaster>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
