import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';

import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardContent from './components/dashboard/DashboardContent';
import AdminPanel from './components/admin/AdminPanel';
import TradePage from './components/pages/TradePage';
import InvestmentPage from './components/pages/InvestmentPage';
import KycPage from './components/pages/KycPage';
import SecurityPage from './components/pages/SecurityPage';
import SettingPage from './components/pages/SettingPage';
import FaqPage from './components/pages/FaqPage';

// Wallet Components
import WalletBalance from './components/wallet/WalletBalance';
import WalletDeposit from './components/wallet/WalletDeposit';
import WalletWithdrawal from './components/wallet/WalletWithdrawal';
import WalletTransfer from './components/wallet/WalletTransfer';


const AppRoutes: React.FC = () => {
  const { status } = useAuth();

  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-950/80 via-[#0B131D] to-[#080D14] text-white">
        <img src="/dupoin-logo.png" alt="DUPOIN Logo" className="w-20 h-20 mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(34,180,195,0.6)] object-contain" />
        <div className="text-xl font-bold tracking-wider text-cyan-400 font-sans">DUPOIN</div>
        <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">ONE STOP TRADING PLATFORM</div>
      </div>
    );
  }

  return (
    <Router>
      {status === 'UNAUTHENTICATED' ? (
        <AuthLayout>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthLayout>
      ) : (
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DashboardContent />} />
            <Route path="/trade" element={<TradePage />} />
            
            {/* Wallet Routes */}
            <Route path="/wallet" element={<Navigate to="/wallet/balance" replace />} />
            <Route path="/wallet/balance" element={<WalletBalance />} />
            <Route path="/wallet/add-balance" element={<WalletDeposit />} />
            <Route path="/wallet/transfer" element={<WalletTransfer />} />
            <Route path="/wallet/withdrawal" element={<WalletWithdrawal />} />
            
            <Route path="/investment" element={<InvestmentPage />} />
            <Route path="/kyc" element={<KycPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/setting" element={<SettingPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Redirect old routes if necessary, or just catch all */}
            <Route path="/deposit" element={<Navigate to="/wallet/add-balance" />} />
            <Route path="/withdrawal" element={<Navigate to="/wallet/withdrawal" />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      )}
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TransactionProvider>
        <AppRoutes />
      </TransactionProvider>
    </AuthProvider>
  );
};

export default App;