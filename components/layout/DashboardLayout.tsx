import React, { useState } from 'react';
import Header from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F4F6F9] text-[#45545C] font-sans selection:bg-primary selection:text-white">
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300 ease-in-out min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* 
            Padding Top Calculation:
            - Cyan Header: 54px
            - Ticker Tape: 72px
            - TOTAL: 126px (~138px with top margin)
        */}
        <main className="flex-1 px-3 sm:px-6 pt-[138px] pb-8 min-w-0">
          {!user?.isVerified && (
            <div className="bg-red-50 text-[#F20D16] p-4 rounded-xl shadow-sm mb-6 flex items-start border border-red-200">
              <InformationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0 text-[#F20D16]" />
              <div>
                <h3 className="font-bold text-base">Verifikasi Akun</h3>
                <p className="text-sm mt-1 text-[#45545C]">
                  Silakan verifikasi akun Anda untuk mengakses semua fitur perdagangan.
                </p>
              </div>
            </div>
          )}
          
          <div className="animate-fade-in w-full h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;