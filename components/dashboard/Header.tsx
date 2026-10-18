import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { balance, notifications, accountMode, toggleAccountMode } = useTransactions();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tickerRef.current;
    if (!container) return;

    if (container.querySelector('script') || container.querySelector('iframe')) return;

    try {
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget h-full w-full';
      container.appendChild(widgetDiv);

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "BINANCE:BTCUSDT", "title": "BTCUSDT" },
          { "proName": "BINANCE:ETHUSDT", "title": "ETHUSDT" },
          { "proName": "BINANCE:LTCUSDT", "title": "LTCUSDT" },
          { "proName": "BINANCE:DOGEUSDT", "title": "DOGEUSD" },
          { "proName": "FX_IDC:EURUSD", "title": "EURUSD" },
          { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "light",
        "isTransparent": false,
        "displayMode": "adaptive",
        "locale": "en"
      });
      container.appendChild(script);
    } catch (e) {
      console.warn('TradingView widget initialization notice:', e);
    }
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <>
      {/* 1. MAIN CYAN HEADER (#08B9ED) - 54px height matching reference */}
      <header className="fixed top-0 left-0 lg:left-64 right-0 bg-[#08B9ED] h-[54px] z-[40] flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-sm border-b border-black/5" style={{ height: '54px' }}>
        
        {/* Left: Hamburger Menu Button */}
        <div className="flex items-center shrink-0">
          <button 
            onClick={onToggleSidebar}
            className="text-white p-1.5 rounded-lg hover:bg-black/10 active:scale-95 transition-all flex items-center justify-center min-w-[36px] min-h-[36px] focus:outline-none"
            aria-label="Buka Menu"
          >
            <Bars3Icon className="w-6 h-6 stroke-[2.3]" />
          </button>
        </div>

        {/* Right: Balance Box + Notification Bell + Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
          
          {/* Balance Box: Compact size h-[28px] with Sarala font */}
          <div 
            onClick={toggleAccountMode} 
            className="flex items-center h-[28px] bg-[#2D3748] rounded-md p-0.5 shadow-xs hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer select-none border border-black/10"
            title="Klik untuk beralih mode Real / Demo"
          >
            <div 
              className="text-white px-2 flex items-center h-full font-bold tabular-nums text-xs whitespace-nowrap tracking-wide"
              style={{ fontFamily: "'Sarala', sans-serif" }}
            >
              {formatCurrency(balance)}
            </div>
            <div 
              className="bg-[#00C99A] text-white px-1.5 py-0.5 rounded flex items-center justify-center text-[10px] font-bold tracking-tight whitespace-nowrap h-full"
              style={{ fontFamily: "'Sarala', sans-serif" }}
            >
              {accountMode === 'real' ? 'Real' : 'Demo'}
            </div>
          </div>

          {/* Notification Bell with red indicator dot */}
          <div className="relative flex items-center shrink-0">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false);
              }}
              className="w-[36px] h-[36px] flex items-center justify-center text-white hover:bg-black/10 rounded-full transition-colors relative focus:outline-none"
              aria-label="Notifikasi"
            >
              <BellIcon className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#08B9ED]"></span>
            </button>
            {isNotificationsOpen && (
              <NotificationDropdown
                notifications={notifications}
                onClose={() => setIsNotificationsOpen(false)}
              />
            )}
          </div>

          {/* Profile Photo: Circular avatar */}
          <div className="relative flex items-center shrink-0">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
              }}
              className="w-[36px] h-[36px] rounded-full overflow-hidden ring-2 ring-white/80 hover:ring-white transition-all shadow-sm flex items-center justify-center bg-white/20 shrink-0 focus:outline-none"
              aria-label="Profil Pengguna"
            >
              {user?.profilePictureUrl ? (
                <img 
                  src={user.profilePictureUrl} 
                  alt="Foto Profil" 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircleIcon className="w-full h-full text-white" />
              )}
            </button>
            {isProfileOpen && <ProfileDropdown onClose={() => setIsProfileOpen(false)} />}
          </div>
        </div>
      </header>

      {/* 2. TICKER TAPE BAR (Height: 72px matching user reference photo) */}
      <div 
        className="fixed top-[54px] left-0 lg:left-64 right-0 w-full lg:w-[calc(100%-16rem)] h-[72px] bg-white border-b border-gray-200 z-[30] shadow-xs flex items-center overflow-hidden"
        style={{ height: '72px' }}
      >
        <div className="tradingview-widget-container h-full w-full min-w-full" ref={tickerRef}>
          <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>
      </div>
    </>
  );
};

export default Header;