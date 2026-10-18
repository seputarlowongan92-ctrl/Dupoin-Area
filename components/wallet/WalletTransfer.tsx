import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import WalletLayout from './WalletLayout';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const WalletTransfer: React.FC = () => {
  const { transfer, balance, isLoadingTransactions } = useTransactions();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const num = parseFloat(amount.replace(/\D/g, ''));
    if (!email) { setMsg({type:'error', text: 'Email penerima wajib diisi'}); return; }
    if (!num || num <= 0) { setMsg({type:'error', text: 'Masukkan jumlah transfer yang valid'}); return; }
    
    const res = await transfer(email, num);
    if (res.success) {
      setMsg({type:'success', text: res.message});
      setAmount('');
      setEmail('');
    } else {
      setMsg({type:'error', text: res.message});
    }
  };

  return (
    <WalletLayout>
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-cyan-50 rounded-xl mr-3.5 border border-[#08B9ED]/20">
            <ArrowsRightLeftIcon className="w-6 h-6 text-[#08B9ED]" />
          </div>
          <div>
            <h3 className="text-[#45545C] text-xl font-bold tracking-tight">Internal Transfer</h3>
            <p className="text-[#89939D] text-xs">Kirim saldo ke akun pengguna lain secara instan tanpa biaya.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-gray-200">
            <label className="block text-[#89939D] text-xs font-semibold mb-1">Saldo Tersedia</label>
            <p className="text-[#45545C] font-sans font-bold tabular-nums text-xl">Rp {balance.toLocaleString('id-ID')}</p>
          </div>

          <div>
            <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Email Penerima</label>
            <input 
              type="email" 
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm outline-none focus:border-[#08B9ED]"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Jumlah Transfer (Rp)</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-[#08B9ED]">
              <div className="bg-[#F8FAFC] text-[#45545C] text-sm px-3.5 py-2.5 border-r border-gray-300 font-bold flex items-center justify-center">
                IDR
              </div>
              <input 
                type="text" 
                className="w-full bg-white px-3.5 py-2.5 text-[#45545C] text-sm outline-none font-sans tabular-nums"
                placeholder="100.000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoadingTransactions}
            className="w-full bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold py-3 rounded-lg text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
          >
            {isLoadingTransactions ? 'Memproses Transfer...' : 'Kirim Saldo'}
          </button>

          {msg && (
            <div className={`p-3.5 rounded-lg text-xs font-medium ${msg.type === 'success' ? 'bg-[#00C99A]/15 text-[#009E78] border border-[#00C99A]/30' : 'bg-[#F20D16]/15 text-[#D10B12] border border-[#F20D16]/30'}`}>
              {msg.text}
            </div>
          )}
        </form>
      </div>
    </WalletLayout>
  );
};

export default WalletTransfer;