import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useWalletStore } from "./store/walletStore";
import Layout from "./components/layout/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Swap from "./pages/Swap";
import Buy from "./pages/Buy";
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

function AppRoutes() {
  const { wallets } = useWalletStore();
  const hasWallet = wallets.length > 0;

  return (
    <Routes>
      {/* Show landing page if no wallet, otherwise redirect to dashboard */}
      <Route 
        path="/" 
        element={hasWallet ? <Navigate to="/dashboard" replace /> : <Landing />} 
      />
      
      {/* Protected routes - require wallet */}
      <Route element={hasWallet ? <Layout /> : <Navigate to="/" replace />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="swap" element={<Swap />} />
        <Route path="buy" element={<Buy />} />
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
