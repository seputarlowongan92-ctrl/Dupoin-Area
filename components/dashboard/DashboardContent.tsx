import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { MOCK_NEWS } from '../../constants';
import { 
  HomeIcon, 
  UserGroupIcon, 
  GiftIcon, 
  ChartBarIcon, 
  WalletIcon, 
  NewspaperIcon, 
  InformationCircleIcon,
  ClipboardIcon
} from '@heroicons/react/24/solid';

const WaveSvg = ({ color }: { color: string }) => (
  <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full h-16 sm:h-20 opacity-15 pointer-events-none">
    <path fill={color} fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
  </svg>
);

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, waveColor }: any) => (
  <div className="bg-white rounded-xl relative overflow-hidden h-40 border border-gray-200 shadow-sm group transition-all duration-300 hover:border-[#08B9ED]/60">
    <div className="p-5 z-10 relative h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Icon className={`w-7 h-7 ${colorClass}`} />
            <h3 className="text-[#45545C] font-bold text-lg">{title}</h3>
          </div>
          <p className="text-[#89939D] text-[10px] uppercase tracking-widest font-semibold">{subtext}</p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded cursor-pointer hover:bg-[#08B9ED]/10 transition-colors border border-gray-200">
          <span className="text-[#08B9ED] text-[10px] font-bold">Detail</span>
        </div>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-[#45545C] tabular-nums" style={{ fontFamily: "'Sarala', sans-serif" }}>{value}</h4>
      </div>
    </div>
    <WaveSvg color={waveColor} />
  </div>
);

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { balance, notifications } = useTransactions();
  const forexRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState('Salin Link Reff');

  const referralLink = user ? `https://dupoin.com/?reff=${user.username}` : 'Memuat...';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyStatus('Tersalin!');
    setTimeout(() => setCopyStatus('Salin Link Reff'), 2000);
  };

  // Mount TradingView Forex Rates directly
  useEffect(() => {
    const container = forexRef.current;
    if (!container) return;

    if (container.querySelector('script') || container.querySelector('iframe')) return;

    try {
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      widgetDiv.style.height = '100%';
      widgetDiv.style.width = '100%';
      container.appendChild(widgetDiv);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "100%", 
        "currencies": [
          "EUR",
          "USD",
          "JPY",
          "GBP",
          "CHF",
          "AUD",
          "CAD",
          "NZD"
        ],
        "isTransparent": false,
        "colorTheme": "light",
        "locale": "id"
      });
      container.appendChild(script);
    } catch (e) {
      console.warn('Forex widget initialization notice:', e);
    }
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
       
      {/* 1. HEADER RINGKASAN */}
      <div className="bg-white p-5 rounded-xl flex flex-col md:flex-row justify-between items-center border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-[#45545C] mb-2 md:mb-0">
          Ringkasan <span className="text-[#89939D] font-normal text-lg ml-2">Panel Kontrol</span>
        </h1>
        <div className="flex items-center text-xs text-[#89939D] bg-[#F4F6F9] px-3.5 py-1.5 rounded-full border border-gray-200 font-medium">
          <HomeIcon className="w-3.5 h-3.5 mr-2 text-[#89939D]" />
          <span className="hover:text-[#08B9ED] cursor-pointer transition-colors">Beranda</span>
          <span className="mx-2">&gt;</span>
          <span className="text-[#45545C] font-semibold">Dashboard</span>
        </div>
      </div>

      {/* 2. IKHTISAR PASAR (FOREX RATES) */}
      <div className="w-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="bg-[#F8FAFC] px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-[#08B9ED]" />
            <span className="text-[#45545C] font-bold text-base">Ikhtisar Pasar</span>
            <span className="bg-[#08B9ED]/10 text-[#08B9ED] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Forex Rates
            </span>
            <span className="bg-[#00C99A]/15 text-[#009E78] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>
          <span className="text-xs text-[#89939D] font-medium hidden sm:inline">
            Kurs Silang Valuta Asing Terkini
          </span>
        </div>

        {/* Forex Rates Widget */}
        <div className="w-full h-[460px] sm:h-[500px] bg-white relative">
          <div className="tradingview-widget-container w-full h-full" ref={forexRef}></div>
        </div>
      </div>

      {/* 3. REFERRAL LINK BAR */}
      <div className="flex flex-col md:flex-row shadow-sm rounded-xl overflow-hidden border border-gray-200 bg-white">
        <div className="flex-grow p-4 text-[#45545C] text-sm flex items-center bg-slate-50 border-b md:border-b-0 md:border-r border-gray-200">
          <span className="truncate">{referralLink}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold px-8 py-4 text-sm transition-all active:scale-95 flex items-center justify-center space-x-2"
        >
          <ClipboardIcon className="w-4 h-4" />
          <span>{copyStatus}</span>
        </button>
      </div>

      {/* 4. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Referral" subtext="total member" value="0 member" icon={UserGroupIcon} colorClass="text-[#08B9ED]" waveColor="#08B9ED" />
        <StatCard title="Bonus" subtext="total bonus" value="Rp 0" icon={GiftIcon} colorClass="text-[#00C99A]" waveColor="#00C99A" />
        <StatCard title="Profit" subtext="total profit" value="Rp 0" icon={ChartBarIcon} colorClass="text-blue-500" waveColor="#3B82F6" />
        <StatCard title="IDR Wallet" subtext="Saldo Anda" value={`Rp ${balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`} icon={WalletIcon} colorClass="text-amber-500" waveColor="#F59E0B" />
      </div>

      {/* 5. NEWS & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F8FAFC] p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base text-[#45545C] font-bold">Berita Terbaru</h3>
            <span className="text-[#08B9ED] text-xs cursor-pointer hover:underline font-semibold">Lihat Semua</span>
          </div>
          <div className="divide-y divide-gray-100">
            {MOCK_NEWS.map((news) => (
              <div key={news.id} className="p-4 flex items-start space-x-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="p-2.5 rounded-lg bg-cyan-50 text-[#08B9ED] flex-shrink-0 group-hover:scale-105 transition-transform">
                  <NewspaperIcon className="w-5 h-5 text-[#08B9ED]" />
                </div>
                <div>
                  <h4 className="text-[#45545C] text-sm font-bold group-hover:text-[#08B9ED] transition-colors">{news.title}</h4>
                  <p className="text-[#89939D] text-[10px] mt-1 flex items-center uppercase tracking-wide font-medium">
                    <ChartBarIcon className="w-3 h-3 mr-1" />
                    {news.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F8FAFC] p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base text-[#45545C] font-bold">Notifikasi</h3>
            <span className="text-[#08B9ED] text-xs cursor-pointer hover:underline font-semibold" onClick={() => {}}>Bersihkan</span>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="p-4 flex items-start space-x-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="p-2 rounded-lg bg-cyan-50 text-[#08B9ED] flex-shrink-0">
                  <InformationCircleIcon className="w-5 h-5 text-[#08B9ED]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#45545C] text-sm font-medium leading-relaxed">{notif.message}</h4>
                  <p className="text-[#89939D] text-[10px] mt-1 uppercase tracking-wide font-medium">{new Date(notif.date).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <InformationCircleIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-[#89939D] text-sm">Tidak ada notifikasi baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center md:text-left pt-6 border-t border-gray-200">
        <p className="text-[#89939D] text-[11px] uppercase tracking-widest font-semibold">
          Hak Cipta © 2026 <span className="text-[#08B9ED] font-bold">DUPOIN Pro</span>. Seluruh Hak Dilindungi.
        </p>
      </div>
    </div>
  );
};

export default DashboardContent;