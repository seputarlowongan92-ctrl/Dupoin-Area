import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { WithdrawalTransaction, TransactionStatus } from '../../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const WithdrawalHistory: React.FC = () => {
  const { user } = useAuth();
  const { withdrawalHistory, isLoadingTransactions, fetchTransactions } = useTransactions();

  if (!user) {
    return (
      <div className="container mx-auto text-center text-gray-500 py-12">
        Silakan login terlebih dahulu untuk melihat riwayat penarikan.
      </div>
    );
  }

  return (
    <div className="container mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C]">Riwayat Penarikan Dana</h2>
          <p className="text-sm text-[#89939D]">Daftar seluruh riwayat penarikan dana ke rekening Anda.</p>
        </div>
        <button
          onClick={() => fetchTransactions()}
          disabled={isLoadingTransactions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#45545C] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 text-[#08B9ED] ${isLoadingTransactions ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm overflow-x-auto">
        {isLoadingTransactions ? (
          <p className="text-center text-gray-400 py-8">Memuat riwayat penarikan dari database...</p>
        ) : withdrawalHistory.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Belum ada riwayat penarikan dana.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                  Tanggal & ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                  Jumlah Penarikan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                  Metode & Rekening Tujuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {withdrawalHistory.map((transaction: WithdrawalTransaction) => {
                const isSuccess = transaction.status === TransactionStatus.SUCCESS;
                const isPending = transaction.status === TransactionStatus.PENDING;
                const isRejected = transaction.status === TransactionStatus.REJECTED || transaction.status === TransactionStatus.CANCELLED || transaction.status === TransactionStatus.FAILED;

                return (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-[#45545C] font-mono">{transaction.id}</div>
                      <div className="text-[11px] text-[#89939D]">
                        {new Date(transaction.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}, {new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#45545C] font-bold font-sans tabular-nums">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#45545C]">
                      <div className="font-bold text-[#08B9ED] uppercase">{transaction.bankOrEwalletName || transaction.method}</div>
                      <div className="font-mono text-xs">{transaction.accountNumber}</div>
                      <div className="text-[#89939D] uppercase">a.n. {transaction.accountHolderName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSuccess && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00C99A]/15 text-[#009E78] border border-[#00C99A]/30">
                          <CheckCircleIcon className="w-4 h-4 text-[#00C99A]" />
                          <span>Done (Selesai)</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                          <ClockIcon className="w-4 h-4 text-amber-600" />
                          <span>Pending (Proses)</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F20D16]/10 text-[#F20D16] border border-[#F20D16]/30">
                          <XCircleIcon className="w-4 h-4 text-[#F20D16]" />
                          <span>Ditolak</span>
                        </span>
                      )}
                      {!isSuccess && !isPending && !isRejected && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {transaction.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WithdrawalHistory;