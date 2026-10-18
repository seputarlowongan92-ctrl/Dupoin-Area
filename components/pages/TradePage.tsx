import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TradeHistoryItem {
  id: string;
  date: string;
  market: string;
  trx: string;
  package: string;
  amount: number;
  rateStake: number;
  rateEnd: number;
  status: 'Win' | 'Loss' | 'Pending';
}

const MOCK_TRADE_HISTORY: TradeHistoryItem[] = [];

const TradePage: React.FC = () => {
  const { balance } = useTransactions();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stakeAmount, setStakeAmount] = useState('50.000');
  const [tradeTime, setTradeTime] = useState('3 Jam');

  useEffect(() => {
    if (containerRef.current) {
      if (containerRef.current.querySelector('script')) return;

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';
      containerRef.current.appendChild(widgetContainer);

      const script = document.createElement('script');
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": "BINANCE:ETHBTC",
        "interval": "1",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_chart",
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "support_host": "https://www.tradingview.com"
      });
      containerRef.current.appendChild(script);
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* 1. Trading Terminal Card */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col shadow-sm">
        
        {/* Chart Header */}
        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer group">
            <h2 className="text-[#45545C] text-lg font-bold">ETH/BTC</h2>
            <ChevronDownIcon className="w-4 h-4 text-[#89939D] group-hover:text-[#08B9ED] transition-colors" />
          </div>
          <div className="text-xs text-[#89939D]">
            Saldo: <span className="font-bold text-[#45545C]">Rp {balance.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Chart Body */}
        <div className="relative h-[450px] sm:h-[550px] lg:h-[650px] bg-white">
          <div 
            id="tradingview_chart"
            className="tradingview-widget-container w-full h-full" 
            ref={containerRef}
          >
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-[#F8FAFC] border-t border-gray-200 flex flex-wrap lg:flex-nowrap items-center gap-3">
          
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto flex-grow lg:max-w-[200px]">
            <div className="px-3.5 py-2.5 text-[#89939D] text-sm font-semibold border-r border-gray-200 bg-gray-50">IDR</div>
            <input 
              type="text" 
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-3 py-2.5 text-[#45545C] text-sm outline-none font-sans tabular-nums bg-white"
            />
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto flex-grow lg:max-w-[180px] cursor-pointer hover:border-[#08B9ED] transition-colors">
            <div className="px-3 py-2.5 text-[#89939D] border-r border-gray-200 bg-gray-50">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div className="flex-grow flex items-center justify-between px-3 py-2.5">
              <span className="text-[#45545C] text-sm font-medium">{tradeTime}</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#89939D]" />
            </div>
          </div>

          <button className="flex-grow lg:flex-1 bg-[#00C99A] hover:bg-[#00B68B] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-sm">
            <div className="bg-white/20 p-1 rounded-full">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </div>
            <span className="text-base tracking-wide">Buy 99%</span>
          </button>

          <button className="flex-grow lg:flex-1 bg-[#F20D16] hover:bg-[#D90B13] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-sm">
            <div className="bg-white/20 p-1 rounded-full rotate-180">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </div>
            <span className="text-base tracking-wide">Sell 99%</span>
          </button>
        </div>
      </div>

      {/* 2. History Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFC]">
          <h2 className="text-xl font-bold text-[#45545C]">Riwayat Perdagangan</h2>
        </div>
        
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[#89939D] text-xs font-semibold">
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Market</th>
                <th className="px-5 py-3.5">Trx</th>
                <th className="px-5 py-3.5">Paket</th>
                <th className="px-5 py-3.5">Jumlah</th>
                <th className="px-5 py-3.5 text-center">Rate Stake</th>
                <th className="px-5 py-3.5 text-center">Rate End</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-[#45545C]">
              {MOCK_TRADE_HISTORY.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#89939D] text-sm">
                    Belum ada riwayat transaksi perdagangan.
                  </td>
                </tr>
              ) : (
                MOCK_TRADE_HISTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-[#89939D] font-sans tabular-nums">{item.date}</td>
                    <td className="px-5 py-3.5 font-bold">{item.market}</td>
                    <td className="px-5 py-3.5 font-bold">
                      <span className={item.trx === 'BUY' ? 'text-[#00C99A]' : 'text-[#F20D16]'}>
                        {item.trx}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{item.package}</td>
                    <td className="px-5 py-3.5 font-bold font-sans tabular-nums">Rp {item.amount.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3.5 text-center font-sans tabular-nums">{item.rateStake.toFixed(5)}</td>
                    <td className="px-5 py-3.5 text-center font-sans tabular-nums">{item.rateEnd.toFixed(5)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        item.status === 'Win' ? 'bg-[#00C99A]/15 text-[#009E78]' : 'bg-[#F20D16]/15 text-[#D10B12]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TradePage;