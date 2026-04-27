import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { LanguageProvider } from './context/LanguageContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/SalesPage';
import ExpensesPage from './pages/ExpensesPage';
import InventoryPage from './pages/InventoryPage';
import DebtsPage from './pages/DebtsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import MpesaReconciliationPage from './pages/MpesaReconciliationPage';
import CalculatorPage from './pages/CalculatorPage';
import AIAssistant from './components/ai/AIAssistant';

function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-bold text-emerald-600 italic">Biashara Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <>
      {children}
      <AIAssistant />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <BusinessProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/app" element={<AuthenticatedApp><DashboardLayout /></AuthenticatedApp>}>
                <Route index element={<Dashboard />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="debts" element={<DebtsPage />} />
                <Route path="mpesa" element={<MpesaReconciliationPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="calculator" element={<CalculatorPage />} />
              </Route>
            </Routes>
          </BusinessProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
