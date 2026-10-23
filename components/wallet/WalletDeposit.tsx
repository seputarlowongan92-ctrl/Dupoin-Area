import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const WalletDeposit: React.FC = () => {
  const { deposit, isLoadingTransactions } = useTransactions();
  const location = useLocation();
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const amountParam = queryParams.get('amount') || location.state?.amount;
    if (amountParam) {
      const numeric = amountParam.toString().replace(/\D/g, '');
      setAmount(numeric);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\D/g, ''));
    if (!num || num <= 0) {
      setMsg({ type: 'error', text: 'Masukkan jumlah deposit yang valid' });
      return;
    }
    const success = await deposit(num);
    if (success) {
      setMsg({
        type: 'success', 
        text: 'UNTUK MELAKUKAN DEPOSIT HANYA MELALUI TELEGRAM ADMIN , SILAHKAN HUBUNGI ADMIN DAN ISI FORMULIR YANG TELAH DIBERIKAN . TERIMAKASIH'
      });
      setAmount('');
    } else {
      setMsg({ type: 'error', text: 'Gagal membuat permintaan deposit.' });
    }
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('id-ID');
  };

  return (
    <WalletLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Form Input Deposit */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[#45545C] text-xl font-bold mb-4 tracking-tight">Deposit Saldo</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Jumlah Deposit (Rp)</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-300 focus-within:border-[#08B9ED]">
                  <div className="bg-[#F8FAFC] text-[#45545C] text-sm px-3.5 py-2.5 border-r border-gray-300 font-bold flex items-center justify-center">
                    IDR
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-white px-3.5 py-2.5 text-[#45545C] outline-none font-sans tabular-nums text-sm"
                    placeholder="Contoh: 1.000.000"
                    value={formatCurrencyInput(amount)}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoadingTransactions} 
                className="w-full bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.99] text-sm disabled:opacity-60 cursor-pointer"
              >
                {isLoadingTransactions ? 'Memproses...' : 'Kirim Permintaan Deposit'}
              </button>

              {msg && (
                <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed ${
                  msg.type === 'success' 
                    ? 'bg-[#00C99A]/15 text-[#008A69] border border-[#00C99A]/30 flex items-start gap-2' 
                    : 'bg-[#F20D16]/15 text-[#D10B12] border border-[#F20D16]/30 flex items-start gap-2'
                }`}>
                  {msg.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-[#00C99A] shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-[#F20D16] shrink-0 mt-0.5" />
                  )}
                  <span>{msg.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Pengumuman Telegram Resmi (Menggantikan Rekening Perusahaan) */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#0088cc]/10 text-[#0088cc] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Instruksi Resmi Deposit</span>
              </div>

              <h3 className="text-[#45545C] text-xl font-bold mb-4 tracking-tight">
                Informasi Penting Deposit
              </h3>

              {/* Teks Pengumuman Sesuai Permintaan User */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <InformationCircleIcon className="w-8 h-8" />
                </div>
                
                <div className="text-amber-950 font-black text-sm sm:text-base leading-relaxed tracking-wider font-sans uppercase">
                  "UNTUK MELAKUKAN DEPOSIT HANYA MELALUI TELEGRAM ADMIN , SILAHKAN HUBUNGI ADMIN DAN ISI FORMULIR YANG TELAH DIBERIKAN . TERIMAKASIH"
                </div>
              </div>

              <div className="mt-6 space-y-3 text-xs text-[#89939D] leading-relaxed">
                <p className="flex items-center gap-2 text-[#45545C] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#08B9ED]"></span>
                  <span>Proses transaksi deposit dilakukan secara resmi melalui akun Telegram Admin.</span>
                </p>
                <p className="flex items-center gap-2 text-[#45545C] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#08B9ED]"></span>
                  <span>Silakan hubungi admin dan lengkapi formulir deposit yang diberikan untuk memverifikasi dana.</span>
                </p>
                <p className="flex items-center gap-2 text-[#45545C] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#08B9ED]"></span>
                  <span>Saldo akun Anda akan langsung bertambah setelah konfirmasi admin selesai.</span>
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <a 
                href="https://t.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Hubungi Telegram Admin Sekarang</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </WalletLayout>
  );
};

export default WalletDeposit;