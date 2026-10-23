import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { BanknotesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';

const DepositForm: React.FC = () => {
  const { user } = useAuth();
  const { deposit, isLoadingTransactions, transactionError } = useTransactions();
  const [amount, setAmount] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; api?: string }>({});
  const [depositSuccessMessage, setDepositSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transactionError) {
      setErrors(prev => ({ ...prev, api: transactionError }));
    } else {
      setErrors(prev => ({ ...prev, api: undefined }));
    }
  }, [transactionError]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0.';
    } else if (parsedAmount < 10000) {
      newErrors.amount = 'Minimum deposit amount is Rp 10,000.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) {
      return;
    }

    setDepositSuccessMessage(null);
    const success = await deposit(parseFloat(amount));

    if (success) {
      setDepositSuccessMessage('UNTUK MELAKUKAN DEPOSIT HANYA MELALUI TELEGRAM ADMIN , SILAHKAN HUBUNGI ADMIN DAN ISI FORMULIR YANG TELAH DIBERIKAN . TERIMAKASIH');
      setAmount('');
      setErrors({});
    } else {
      setErrors(prev => ({ ...prev, api: transactionError || 'Failed to submit deposit. Please try again.' }));
    }
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('en-US');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, '');
    setAmount(numericValue);
    setErrors(prev => ({ ...prev, amount: undefined, api: undefined }));
  };

  return (
    <div className="container mx-auto font-sans">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C] mb-6">Deposit Dana</h2>

      <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-sm">
        {errors.api && (
          <div className="bg-[#F20D16]/10 text-[#D10B12] p-4 rounded-xl mb-6 text-sm border border-[#F20D16]/30">
            {errors.api}
          </div>
        )}
        {depositSuccessMessage && (
          <div className="bg-[#00C99A]/15 text-[#008A69] p-4 rounded-xl mb-6 text-sm font-bold border border-[#00C99A]/30">
            {depositSuccessMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="depositAmount"
              label="Jumlah Deposit (Rp)"
              type="text"
              placeholder="Contoh: 1.000.000"
              icon={<BanknotesIcon />}
              value={formatCurrencyInput(amount)}
              onChange={handleAmountChange}
              error={errors.amount}
              inputMode="numeric"
            />

            <Button type="submit" fullWidth isLoading={isLoadingTransactions} disabled={isLoadingTransactions}>
              Kirim Permintaan Deposit
            </Button>
          </form>

          {/* Announcement Card (Menggantikan Rekening Perusahaan) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <InformationCircleIcon className="w-7 h-7" />
            </div>

            <div className="text-amber-950 font-black text-sm sm:text-base leading-relaxed tracking-wider uppercase">
              "UNTUK MELAKUKAN DEPOSIT HANYA MELALUI TELEGRAM ADMIN , SILAHKAN HUBUNGI ADMIN DAN ISI FORMULIR YANG TELAH DIBERIKAN . TERIMAKASIH"
            </div>

            <div className="pt-2">
              <a 
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Hubungi Telegram Admin
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-[#89939D] text-xs">
            Lihat riwayat deposit Anda <a href="/#/deposit-history" className="text-[#08B9ED] font-bold hover:underline">di sini</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;