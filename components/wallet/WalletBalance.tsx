import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const WalletBalance: React.FC = () => {
  const { balance } = useTransactions();

  return (
    <WalletLayout>
      <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center shadow-sm font-sans">
        <div className="inline-block p-5 bg-cyan-50 rounded-full mb-6 border border-[#08B9ED]/20">
          <BanknotesIcon className="w-12 h-12 text-[#08B9ED]" />
        </div>
        <h3 className="text-[#89939D] text-base sm:text-lg mb-2 font-medium">Total Saldo Tersedia</h3>
        <h1 className="text-4xl sm:text-5xl text-[#45545C] font-bold tabular-nums mb-8" style={{ fontFamily: "'Sarala', sans-serif" }}>
          Rp {balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </h1>
        <div className="max-w-md mx-auto p-4 bg-[#F8FAFC] rounded-xl border border-gray-200">
          <p className="text-[#89939D] text-sm leading-relaxed">
            Saldo ini dapat digunakan untuk perdagangan, investasi, atau ditarik ke rekening bank terdaftar Anda secara instan.
          </p>
        </div>
      </div>
    </WalletLayout>
  );
};

export default WalletBalance;