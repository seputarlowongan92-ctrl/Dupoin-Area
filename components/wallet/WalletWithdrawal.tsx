import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { E_WALLET_OPTIONS, BANK_OPTIONS } from '../../constants';
import { TransactionStatus } from '../../types';
import WalletLayout from './WalletLayout';
import { InformationCircleIcon, ChevronDownIcon, BuildingLibraryIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const WalletWithdrawal: React.FC = () => {
  const { user, savedBankAccounts, addBankAccount } = useAuth();
  const { balance, withdraw, isLoadingTransactions, withdrawalHistory, accountMode } = useTransactions();
  
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'bank' | 'e-wallet'>('bank');
  const [selectedAccountChoice, setSelectedAccountChoice] = useState<string>('');
  const [bankOrEwalletName, setBankOrEwalletName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [saveToSettings, setSaveToSettings] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isLowBalance = balance <= 0;

  // Otomatis terisi jika ada rekening penarikan yang sudah tersimpan di Pengaturan.
  // Jika belum ada rekening tersimpan, kolom tetap kosong sebelum user mengetik atau menyimpannya di pengaturan.
  useEffect(() => {
    if (savedBankAccounts && savedBankAccounts.length > 0) {
      // Prioritaskan rekening berstatus Utama (Primary), atau rekening pertama
      const primary = savedBankAccounts.find(a => a.isPrimary) || savedBankAccounts[0];
      if (primary) {
        setSelectedAccountChoice(`saved:${primary.id}`);
        setBankOrEwalletName(primary.bankName);
        setAccountNumber(primary.accountNumber);
        setAccountHolderName(primary.accountHolderName);
        const isEwallet = E_WALLET_OPTIONS.some(e => primary.bankName.toLowerCase().includes(e.toLowerCase()));
        setMethod(isEwallet ? 'e-wallet' : 'bank');
      }
    } else {
      // Kosongkan semua kolom jika belum ada rekening tersimpan
      setSelectedAccountChoice('');
      setBankOrEwalletName('');
      setAccountNumber('');
      setAccountHolderName('');
    }
  }, [savedBankAccounts]);

  const handleAccountChoiceChange = (choice: string) => {
    setSelectedAccountChoice(choice);
    setMessage(null);

    if (choice.startsWith('saved:')) {
      const accountId = choice.replace('saved:', '');
      const found = savedBankAccounts?.find(a => a.id === accountId);
      if (found) {
        setBankOrEwalletName(found.bankName);
        setAccountNumber(found.accountNumber);
        setAccountHolderName(found.accountHolderName);
        const isEwallet = E_WALLET_OPTIONS.some(e => found.bankName.toLowerCase().includes(e.toLowerCase()));
        setMethod(isEwallet ? 'e-wallet' : 'bank');
      }
    } else if (choice.startsWith('bank:')) {
      const bName = choice.replace('bank:', '');
      setBankOrEwalletName(bName);
      setMethod('bank');
      setAccountNumber('');
      setAccountHolderName('');
    } else if (choice.startsWith('ewallet:')) {
      const ewName = choice.replace('ewallet:', '');
      setBankOrEwalletName(ewName);
      setMethod('e-wallet');
      setAccountNumber('');
      setAccountHolderName('');
    } else {
      setBankOrEwalletName('');
      setAccountNumber('');
      setAccountHolderName('');
    }
  };

  const handleQuickSaveToSettings = async () => {
    if (!bankOrEwalletName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      setMessage({ type: 'error', text: 'Lengkapi nama bank, nomor rekening, dan nama pemilik terlebih dahulu untuk menyimpan ke pengaturan.' });
      return;
    }
    const ok = await addBankAccount({
      bankName: bankOrEwalletName,
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim().toUpperCase(),
      isPrimary: !savedBankAccounts || savedBankAccounts.length === 0,
    });
    if (ok) {
      setMessage({ type: 'success', text: 'Rekening berhasil disimpan ke Pengaturan Akun dan akan otomatis terisi untuk penarikan berikutnya!' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (accountMode === 'demo') {
      setMessage({ type: 'error', text: 'Penarikan tidak dapat dilakukan pada mode Demo.' });
      return;
    }

    if (!bankOrEwalletName.trim()) {
      setMessage({ type: 'error', text: 'Silakan pilih tujuan bank atau e-wallet penarikan.' });
      return;
    }

    if (!accountNumber.trim()) {
      setMessage({ type: 'error', text: 'Nomor rekening atau nomor e-wallet tidak boleh kosong.' });
      return;
    }

    if (!accountHolderName.trim()) {
      setMessage({ type: 'error', text: 'Nama pemilik rekening tidak boleh kosong.' });
      return;
    }

    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Masukkan jumlah penarikan yang valid.' });
      return;
    }

    if (numAmount < 10000) {
      setMessage({ type: 'error', text: 'Jumlah penarikan minimal Rp 10.000.' });
      return;
    }

    if (numAmount > balance) {
      setMessage({ type: 'error', text: 'Saldo tidak mencukupi untuk melakukan penarikan.' });
      return;
    }

    // Jika pengguna mencentang simpan rekening ke pengaturan dan belum tersimpan
    if (saveToSettings && !selectedAccountChoice.startsWith('saved:')) {
      await addBankAccount({
        bankName: bankOrEwalletName,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim().toUpperCase(),
        isPrimary: !savedBankAccounts || savedBankAccounts.length === 0,
      });
    }

    const fullMethodName = method === 'bank' ? `Bank (${bankOrEwalletName})` : `E-Wallet (${bankOrEwalletName})`;
    const success = await withdraw(numAmount, fullMethodName, bankOrEwalletName, accountNumber, accountHolderName);

    if (success) {
      const trxId = 'E' + Math.floor(1000 + Math.random() * 9000) + 'NR' + Math.floor(100 + Math.random() * 900) + 'IRN';
      setMessage({ 
        type: 'success', 
        text: `Penarikan IDR Balance no ${trxId} berhasil diajukan, mohon tunggu kami akan memproses penarikan dana Anda.` 
      });
      setAmount('');
    } else {
      setMessage({ type: 'error', text: 'Penarikan gagal diproses. Periksa saldo Anda.' });
    }
  };

  return (
    <WalletLayout>
      {/* Alert / Feedback Banner */}
      {message && message.type === 'success' && (
        <div className="bg-[#00C99A] text-white p-4 rounded-xl font-medium text-sm leading-relaxed mb-6 shadow-sm border border-emerald-400/30">
          {message.text}
        </div>
      )}

      {message && message.type === 'error' && (
        <div className="bg-[#F20D16] text-white p-4 rounded-xl font-medium text-sm leading-relaxed mb-6 shadow-sm">
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Withdrawal Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[#45545C] text-xl font-bold tracking-tight">Withdrawal</h3>
              <Link 
                to="/setting?tab=bank"
                className="text-xs text-[#08B9ED] hover:underline font-semibold flex items-center gap-1"
                title="Kelola rekening tersimpan di Pengaturan"
              >
                <BuildingLibraryIcon className="w-3.5 h-3.5" />
                <span>Pengaturan Rekening</span>
              </Link>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Available Balance Section */}
              <div>
                <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Available Balance</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <div className="bg-white text-[#45545C] text-sm px-3.5 py-2.5 border-r border-gray-300 font-bold flex items-center justify-center min-w-[54px]">
                    IDR
                  </div>
                  <div className={`flex-1 ${isLowBalance ? 'bg-[#F20D16] text-white' : 'bg-[#00C99A] text-white'} text-sm px-3.5 py-2.5 font-bold font-sans tabular-nums flex items-center`}>
                    {isLowBalance ? 'No Balance' : `Rp ${balance.toLocaleString('id-ID')}`}
                  </div>
                </div>
              </div>

              {/* Currency (Fixed) */}
              <div>
                <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Withdrawal Currency</label>
                <div className="bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm flex items-center justify-between">
                  <span>IDR (Indonesia Rupiah)</span>
                  <ChevronDownIcon className="w-4 h-4 text-[#89939D]" />
                </div>
              </div>

              {/* Withdrawal To */}
              <div>
                <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Withdrawal To</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] appearance-none pr-8 cursor-pointer"
                    value={selectedAccountChoice}
                    onChange={(e) => handleAccountChoiceChange(e.target.value)}
                  >
                    <option value="">-- Pilih Rekening / Bank Penarikan --</option>
                    
                    {/* Saved Accounts from Settings */}
                    {savedBankAccounts && savedBankAccounts.length > 0 && (
                      <optgroup label="⭐ Rekening Tersimpan (Pengaturan)">
                        {savedBankAccounts.map(acc => (
                          <option key={acc.id} value={`saved:${acc.id}`}>
                            {acc.bankName} - {acc.accountNumber} ({acc.accountHolderName}){acc.isPrimary ? ' [Utama]' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Standard Bank Options */}
                    <optgroup label="🏦 Bank Lain (Input Manual)">
                      {BANK_OPTIONS.map(b => (
                        <option key={b} value={`bank:${b}`}>Bank : {b}</option>
                      ))}
                    </optgroup>

                    {/* Standard E-Wallet Options */}
                    <optgroup label="📱 E-Wallet (Input Manual)">
                      {E_WALLET_OPTIONS.map(e => (
                        <option key={e} value={`ewallet:${e}`}>E-Wallet : {e}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-[#89939D] absolute right-3 top-3.5 pointer-events-none" />
                </div>
                
                {/* Account Number & Name - Empty by default until user types or selects saved */}
                <input 
                  type="text"
                  placeholder="Nomor Rekening / No. HP E-Wallet"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] mt-2 font-sans tabular-nums placeholder:text-gray-400"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                />
                <input 
                  type="text"
                  placeholder="Nama Pemilik Rekening"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] mt-2 uppercase placeholder:text-gray-400"
                  value={accountHolderName}
                  onChange={e => setAccountHolderName(e.target.value)}
                />

                {/* Indicator / Save to Settings Option */}
                {selectedAccountChoice.startsWith('saved:') ? (
                  <div className="mt-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Rekening otomatis terisi dari Pengaturan</span>
                    </div>
                    <Link 
                      to="/setting?tab=bank"
                      className="text-[11px] text-[#08B9ED] hover:underline font-bold shrink-0 ml-2"
                    >
                      Kelola
                    </Link>
                  </div>
                ) : (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#45545C] hover:text-[#08B9ED]">
                        <input
                          type="checkbox"
                          checked={saveToSettings}
                          onChange={(e) => setSaveToSettings(e.target.checked)}
                          className="w-4 h-4 text-[#08B9ED] rounded border-gray-300 focus:ring-[#08B9ED] cursor-pointer"
                        />
                        <span className="font-medium">Simpan rekening ini ke Pengaturan Akun</span>
                      </label>
                      {accountNumber && accountHolderName && bankOrEwalletName && (
                        <button
                          type="button"
                          onClick={handleQuickSaveToSettings}
                          className="text-[11px] bg-slate-100 hover:bg-[#08B9ED] hover:text-white text-[#45545C] px-2.5 py-1 rounded transition-colors font-semibold cursor-pointer"
                          title="Simpan sekarang ke pengaturan"
                        >
                          Simpan Sekarang
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <Link 
                        to="/setting?tab=bank"
                        className="text-[11px] text-[#08B9ED] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>+ Buka Menu Rekening di Pengaturan</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Withdrawal */}
              <div>
                <label className="block text-[#89939D] text-xs font-semibold mb-1.5">Amount Withdrawal</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-[#08B9ED]">
                  <div className="bg-white text-[#45545C] text-sm px-3.5 py-2.5 border-r border-gray-300 font-bold flex items-center justify-center min-w-[54px]">
                    IDR
                  </div>
                  <input 
                    type="text"
                    placeholder="Contoh: 1,000,000"
                    className="flex-1 bg-white px-3.5 py-2.5 text-[#45545C] text-sm outline-none font-sans tabular-nums placeholder:text-[#89939D]"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoadingTransactions} 
                  className="w-full sm:w-auto bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isLoadingTransactions ? 'Processing...' : 'Submit Withdrawal'}
                </button>
              </div>

              {/* Notice Box */}
              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-lg text-amber-900 text-xs mt-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="w-4 h-4 mr-1.5 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Notice:</span>
                    <p className="text-amber-800">Min Rp 10,000, Max Rp 500,000,000, Fee 0%.</p>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-[#45545C] text-xl font-bold tracking-tight">Withdrawal History</h3>
            </div>
            
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex space-x-2 mb-4">
                  <button className="bg-[#08B9ED] text-white text-xs px-3.5 py-1.5 rounded-md font-semibold hover:bg-[#07A6D5] transition-colors">PDF</button>
                  <button className="bg-[#08B9ED] text-white text-xs px-3.5 py-1.5 rounded-md font-semibold hover:bg-[#07A6D5] transition-colors">Print</button>
                </div>
                
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[#89939D] text-xs font-semibold">
                        <th className="p-3 border-r border-gray-200">Fee</th>
                        <th className="p-3 border-r border-gray-200">Received</th>
                        <th className="p-3 border-r border-gray-200">Berita</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawalHistory.map(wd => (
                        <tr key={wd.id} className="text-xs hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-[#89939D] border-r border-gray-200 font-sans tabular-nums">Rp 0</td>
                          <td className="p-3 text-[#45545C] border-r border-gray-200 font-bold font-sans tabular-nums">Rp {wd.amount.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-[#45545C] border-r border-gray-200 max-w-xs leading-relaxed">
                            <div className="font-bold text-[#45545C]">Withdrawal IDR Balance</div>
                            <div className="text-[#89939D]">To: {wd.method}</div>
                            <div className="uppercase font-semibold">{wd.bankOrEwalletName}</div>
                            <div className="font-sans tabular-nums text-[#89939D]">{wd.accountNumber}</div>
                            <div className="uppercase text-[#89939D]">{wd.accountHolderName}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-md text-white font-semibold text-[11px] ${
                              wd.status === TransactionStatus.SUCCESS ? 'bg-[#00C99A]' : 
                              wd.status === TransactionStatus.PENDING ? 'bg-amber-500' : 'bg-[#F20D16]'
                            }`}>
                              {wd.status === TransactionStatus.SUCCESS ? 'Done' : wd.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {withdrawalHistory.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#89939D] text-xs">
                            Belum ada riwayat penarikan dana.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center items-center mt-6 text-xs text-[#89939D] space-x-2">
                <span>Previous</span>
                <span className="bg-[#08B9ED] text-white w-6 h-6 flex items-center justify-center rounded-md font-bold">1</span>
                <span>Next</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WalletLayout>
  );
};

export default WalletWithdrawal;