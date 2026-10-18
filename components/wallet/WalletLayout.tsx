import React from 'react';
import { HomeIcon } from '@heroicons/react/24/solid';

interface WalletLayoutProps {
  children: React.ReactNode;
}

const WalletLayout: React.FC<WalletLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto">
      <div className="mb-6 bg-white border border-gray-200 p-5 sm:p-6 rounded-xl shadow-sm">
        {/* IDR Wallet Title */}
        <h2 className="text-2xl text-[#45545C] font-bold tracking-tight">IDR Wallet</h2>
        
        {/* Breadcrumb Bar */}
        <div className="bg-[#E9ECEF] p-2.5 px-4 rounded-lg flex items-center text-xs text-[#89939D] font-medium mt-4 w-fit max-w-full">
          <HomeIcon className="w-3.5 h-3.5 mr-2 text-[#89939D] shrink-0" /> 
          <span>Home</span> 
          <span className="mx-2 font-light text-gray-400">&gt;</span> 
          <span className="text-[#45545C] font-semibold">IDR Wallet</span>
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default WalletLayout;