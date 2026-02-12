import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import { useWalletStore } from "./store/walletStore";
import Layout from "./components/layout/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Swap from "./pages/Swap";
import Buy from "./pages/Buy";
import Settings from "./pages/Settings";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Auth route wrapper (redirect if already logged in)
function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
      
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-bg">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0B1221',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E1E1E1',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
