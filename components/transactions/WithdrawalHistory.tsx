import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { WithdrawalTransaction, TransactionStatus } from '../../types';

const WithdrawalHistory: React.FC = () => {
  const { user } = useAuth();
  const { withdrawalHistory, isLoadingTransactions } = useTransactions();
  const [historySearch, setHistorySearch] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto text-center text-gray-500 py-12">
        Silakan login terlebih dahulu untuk melihat riwayat penarikan.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatAccountNumberDisplay = (raw: string): string => {
    if (!raw) return '';
    const clean = raw.trim();
    if (clean.includes('-') || clean.includes(' ')) return clean;
    return clean.replace(/(\d{4})(?=\d)/g, '$1-');
  };

  const filteredHistory = withdrawalHistory.filter(wd => {
    if (!historySearch.trim()) return true;
    const lower = historySearch.toLowerCase();
    return (
      wd.id.toLowerCase().includes(lower) ||
      (wd.accountNumber && wd.accountNumber.toLowerCase().includes(lower)) ||
      (wd.bankOrEwalletName && wd.bankOrEwalletName.toLowerCase().includes(lower)) ||
      (wd.accountHolderName && wd.accountHolderName.toLowerCase().includes(lower)) ||
      wd.amount.toString().includes(lower)
    );
  });

  return (
    <div className="container mx-auto font-sans max-w-4xl py-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Top Dark Slate Header Bar from User Screenshot */}
        <div className="bg-[#38485B] px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-white text-lg font-medium tracking-wide">
            Withdrawal History
          </h3>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Action buttons */}
            <div className="flex space-x-2 mb-3">
              <button 
                onClick={handlePrint}
                className="bg-[#0096EB] hover:bg-[#0084D1] text-white text-xs px-4 py-1.5 rounded font-medium transition-colors shadow-xs cursor-pointer"
              >
                PDF
              </button>
              <button 
                onClick={handlePrint}
                className="bg-[#0096EB] hover:bg-[#0084D1] text-white text-xs px-4 py-1.5 rounded font-medium transition-colors shadow-xs cursor-pointer"
              >
                Print
              </button>
            </div>

            {/* Filter Input */}
            <div className="mb-4">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder=""
                className="w-48 bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-700 outline-none focus:border-[#0096EB]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-center border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-[#5A6A7E] text-xs font-semibold">
                    <th className="p-3 border-r border-gray-200 w-24">
                      <div className="inline-flex items-center gap-1">
                        <span>Fee</span>
                        <span className="text-[10px] text-gray-400">⬍</span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-gray-200 w-36">
                      <div className="inline-flex items-center gap-1">
                        <span>Received</span>
                        <span className="text-[10px] text-gray-400">⬍</span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-gray-200">
                      <div className="inline-flex items-center gap-1">
                        <span>Berita</span>
                        <span className="text-[10px] text-gray-400">⬍</span>
                      </div>
                    </th>
                    <th className="p-3 w-32">
                      <div className="inline-flex items-center gap-1">
                        <span>Status</span>
                        <span className="text-[10px] text-gray-400">⬍</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoadingTransactions ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 text-xs">
                        Memuat riwayat penarikan...
                      </td>
                    </tr>
                  ) : filteredHistory.map((wd: WithdrawalTransaction) => {
                    const isDone = wd.status === TransactionStatus.SUCCESS;
                    const isPending = wd.status === TransactionStatus.PENDING;
                    const isRejected = wd.status === TransactionStatus.REJECTED || wd.status === TransactionStatus.CANCELLED || wd.status === TransactionStatus.FAILED;

                    const textColorClass = isPending 
                      ? 'text-[#C0392B]' 
                      : isDone 
                      ? 'text-[#2B3442]' 
                      : 'text-[#C0392B]';

                    return (
                      <tr key={wd.id} className="text-xs transition-colors hover:bg-slate-50/50">
                        {/* Fee */}
                        <td className={`p-4 border-r border-gray-200 font-sans align-top ${textColorClass}`}>
                          Rp 0
                        </td>

                        {/* Received */}
                        <td className={`p-4 border-r border-gray-200 font-sans align-top ${textColorClass}`}>
                          <div>Rp</div>
                          <div className="font-medium mt-0.5">
                            {wd.amount.toLocaleString('en-US')}
                          </div>
                        </td>

                        {/* Berita */}
                        <td className={`p-4 border-r border-gray-200 text-center leading-relaxed align-top ${textColorClass}`}>
                          <div>Withdrawal</div>
                          <div>IDR</div>
                          <div>Balance</div>
                          <div>To: Bank</div>
                          <div>Account</div>
                          <div className="uppercase">
                            (IDR) {wd.accountHolderName}
                          </div>
                          <div className="uppercase font-medium">
                            {wd.bankOrEwalletName || wd.method}
                          </div>
                          <div className="font-sans font-medium tracking-wider">
                            {formatAccountNumberDisplay(wd.accountNumber)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4 align-top text-center">
                          {isDone && (
                            <span className="inline-block px-4 py-1.5 rounded-lg text-white font-medium text-xs bg-[#00BA88] shadow-xs">
                              Done
                            </span>
                          )}

                          {isPending && (
                            <span className="inline-block px-4 py-1.5 rounded-lg text-white font-medium text-xs bg-[#EB7654] shadow-xs">
                              Pending
                            </span>
                          )}

                          {isRejected && (
                            <span className="inline-block px-4 py-1.5 rounded-lg text-white font-medium text-xs bg-[#DC2626] shadow-xs">
                              Rejected
                            </span>
                          )}

                          {!isDone && !isPending && !isRejected && (
                            <span className="inline-block px-3 py-1 rounded text-gray-700 bg-gray-200 font-medium text-xs">
                              {wd.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!isLoadingTransactions && filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-400 text-xs">
                        Belum ada riwayat penarikan dana.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-8 text-xs text-[#89939D]">
            <button type="button" className="hover:text-gray-700 transition-colors cursor-pointer">
              Previous
            </button>
            <span className="w-6 h-6 bg-[#EBA315] text-white font-bold rounded flex items-center justify-center text-xs shadow-xs">
              1
            </span>
            <button type="button" className="hover:text-gray-700 transition-colors cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalHistory;