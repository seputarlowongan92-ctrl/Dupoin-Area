import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { InformationCircleIcon, ClipboardDocumentCheckIcon, CheckIcon } from '@heroicons/react/24/outline';

const WalletDeposit: React.FC = () => {
  const { deposit, companyBankInfoList, isLoadingTransactions } = useTransactions();
  const location = useLocation();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const amountParam = queryParams.get('amount') || location.state?.amount;
    if (amountParam) {
      const numeric = amountParam.toString().replace(/\D/g, '');
      setAmount(numeric);
    }
  }, [location]);
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\D/g, ''));
    if (!num || num <= 0) {
      setMsg({type:'error', text: 'Masukkan jumlah deposit yang valid'});
      return;
    }
    const success = await deposit(num);
    if(success) {
      setMsg({type:'success', text: `Deposit dalam proses, mohon kirim bukti transfer ke admin.`});
      setAmount('');
    } else {
      setMsg({type:'error', text: 'Gagal membuat permintaan deposit.'});
    }
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('id-ID');
  };

  const briBank = {
    bankName: 'Bank Rakyat Indonesia (BRI)',
    accountNumber: '367801004397504',
    accountHolderName: 'GUSTI PUTRAP N'
  };

  const muamalatBank = {
    bankName: 'BANK MUAMALAT',
    accountNumber: '3280019029',
    accountHolderName: 'MUHAMAD DZAKWAN HAKIM'
  };

  const defaultBanks = [briBank, muamalatBank];
  const allBanks = (companyBankInfoList && companyBankInfoList.length > 0)
    ? companyBankInfoList
    : defaultBanks;

  return (
    <WalletLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-[#45545C] text-xl font-bold mb-4 tracking-tight">Deposit Saldo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Jumlah Deposit (Rp)</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-[#08B9ED]">
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
              className="w-full bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold py-3 rounded-lg transition-all shadow-sm active:scale-[0.99] text-sm disabled:opacity-60"
            >
              {isLoadingTransactions ? 'Memproses...' : 'Kirim Permintaan Deposit'}
            </button>
            {msg && (
              <div className={`p-3.5 rounded-lg text-xs font-medium ${msg.type === 'success' ? 'bg-[#00C99A]/15 text-[#009E78] border border-[#00C99A]/30' : 'bg-[#F20D16]/15 text-[#D10B12] border border-[#F20D16]/30'}`}>
                {msg.text}
              </div>
            )}
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-[#45545C] text-xl font-bold mb-4 tracking-tight">Rekening Tujuan Transfer</h3>
          <div className="space-y-3.5">
            {allBanks.map((info, idx) => (
              <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-gray-200 flex justify-between items-center relative overflow-hidden group hover:border-[#08B9ED]/50 transition-colors">
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-[#08B9ED] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg">
                    Rekomendasi
                  </div>
                )}
                <div>
                  <p className="text-[#08B9ED] font-bold text-sm">{info.bankName}</p>
                  <p className="text-[#45545C] text-xl tracking-wider font-sans font-bold tabular-nums my-1">{info.accountNumber}</p>
                  <p className="text-[#89939D] text-xs uppercase font-medium">Atas Nama: {info.accountHolderName}</p>
                </div>
                <button 
                  onClick={() => handleCopy(info.accountNumber)}
                  className="text-[#89939D] hover:text-[#08B9ED] transition-colors p-2 rounded-lg hover:bg-white"
                  title="Salin Nomor Rekening"
                >
                  {copiedText === info.accountNumber ? (
                    <span className="flex items-center text-[#00C99A] text-xs gap-1 font-bold">
                      <CheckIcon className="w-5 h-5" />
                      Tersalin
                    </span>
                  ) : (
                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-lg text-xs mt-4 flex items-start">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800">Mohon transfer dengan jumlah yang tepat. Saldo Anda akan diperbarui secara otomatis setelah verifikasi admin selesai dilakukan.</p>
          </div>
        </div>
      </div>
    </WalletLayout>
  );
};

export default WalletDeposit;