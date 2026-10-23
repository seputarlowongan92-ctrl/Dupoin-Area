import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { Transaction, TransactionStatus, User, CompanyBankInfo, WithdrawalTransaction } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import { 
    BanknotesIcon, 
    CreditCardIcon, 
    BuildingLibraryIcon, 
    PlusIcon, 
    TrashIcon, 
    XMarkIcon, 
    CurrencyDollarIcon, 
    MagnifyingGlassIcon,
    UserPlusIcon,
    EnvelopeIcon,
    PhoneIcon,
    LockClosedIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    getAllUsers,
    updateUserVerification,
    getAllTransactions,
    updateDepositStatus,
    updateWithdrawalStatus,
    companyBankInfoList,
    setCompanyBankInfoList,
    adminUpdateUserBalance,
    adminCreateUser,
    fetchTransactions
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'settings'>('transactions');
  const [bankList, setBankList] = useState<CompanyBankInfo[]>(companyBankInfoList);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [trxSearch, setTrxSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WITHDRAWAL' | 'DEPOSIT' | 'TRANSFER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'REJECTED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'set'>('add');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    balance: '15000000',
    isAdmin: false,
    isVerified: true
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    setBankList(companyBankInfoList);
  }, [companyBankInfoList]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [fetchedUsers, fetchedTransactions] = await Promise.all([
        getAllUsers(),
        getAllTransactions()
      ]);
      setUsers(fetchedUsers);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error loading admin data", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    // Filter by type
    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Search query
    if (trxSearch.trim()) {
      const lower = trxSearch.toLowerCase();
      result = result.filter(t => {
        const u = users.find(usr => usr.id === t.userId);
        const wd = t.type === 'WITHDRAWAL' ? (t as WithdrawalTransaction) : null;
        return (
          t.id.toLowerCase().includes(lower) || 
          t.userId.toLowerCase().includes(lower) ||
          (u?.email && u.email.toLowerCase().includes(lower)) ||
          (u?.fullName && u.fullName.toLowerCase().includes(lower)) ||
          (wd?.accountNumber && wd.accountNumber.toLowerCase().includes(lower)) ||
          (wd?.bankOrEwalletName && wd.bankOrEwalletName.toLowerCase().includes(lower)) ||
          (wd?.accountHolderName && wd.accountHolderName.toLowerCase().includes(lower))
        );
      });
    }

    setFilteredTransactions(result);
  }, [trxSearch, typeFilter, statusFilter, transactions, users]);

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto text-center text-red-500 py-16">
        <h2 className="text-2xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-gray-500">Anda harus masuk sebagai Administrator untuk mengakses halaman ini.</p>
      </div>
    );
  }

  const handleStatusChange = async (t: Transaction, newStatus: TransactionStatus) => {
    if (t.status === newStatus) return;
    
    setIsRefreshing(true);
    try {
      let ok = false;
      if (t.type === 'DEPOSIT') {
        ok = await updateDepositStatus(t.id, newStatus);
      } else if (t.type === 'WITHDRAWAL') {
        ok = await updateWithdrawalStatus(t.id, newStatus);
      }

      if (ok) {
        const statusLabel = newStatus === TransactionStatus.SUCCESS ? 'DONE (Selesai)' : newStatus;
        setActionMessage({
          type: 'success',
          text: `Status transaksi #${t.id} berhasil diubah menjadi ${statusLabel} dan tercatat di database.`
        });
        setTimeout(() => setActionMessage(null), 5000);
      }
      await loadData();
      await fetchTransactions();
    } catch (err) {
      console.error('Error changing transaction status', err);
      setActionMessage({
        type: 'error',
        text: 'Gagal memperbarui status transaksi di database.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    if (!createData.fullName || !createData.email || !createData.password) {
      setCreateError("Nama lengkap, Email, dan Password wajib diisi.");
      setCreateLoading(false);
      return;
    }

    try {
      const success = await adminCreateUser({
        fullName: createData.fullName,
        email: createData.email,
        phoneNumber: createData.phoneNumber,
        password: createData.password,
        balance: parseFloat(createData.balance) || 0,
        isAdmin: createData.isAdmin,
        isVerified: createData.isVerified
      });

      if (success) {
        setIsCreateModalOpen(false);
        setCreateData({
          fullName: '',
          email: '',
          phoneNumber: '',
          password: '',
          balance: '15000000',
          isAdmin: false,
          isVerified: true
        });
        await loadData();
      } else {
        setCreateError("Gagal menambahkan pengguna. Email mungkin sudah terdaftar.");
      }
    } catch (err) {
      setCreateError("Terjadi kesalahan saat membuat pengguna.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBankChange = (index: number, field: keyof CompanyBankInfo, value: string) => {
    const updatedList = [...bankList];
    updatedList[index][field] = value;
    setBankList(updatedList);
  };

  const addBank = () => {
    setBankList([...bankList, { bankName: '', accountNumber: '', accountHolderName: '' }]);
  };

  const removeBank = (index: number) => {
    const updatedList = bankList.filter((_, i) => i !== index);
    setBankList(updatedList);
  };

  const handleUpdateBankInfo = () => {
    setCompanyBankInfoList(bankList);
    alert('Informasi Rekening Perusahaan Berhasil Diperbarui!');
  };

  const openBalanceModal = (u: User) => {
    setSelectedUserForBalance(u);
    setBalanceAmount('');
    setBalanceOperation('add');
    setIsBalanceModalOpen(true);
  };

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !balanceAmount) return;

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount)) {
      alert("Masukkan angka yang valid");
      return;
    }

    await adminUpdateUserBalance(selectedUserForBalance.id, amount, balanceOperation);
    setIsBalanceModalOpen(false);
    setSelectedUserForBalance(null);
    setBalanceAmount('');
    await loadData();
  };

  const getUser = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  // Stats calculation
  const withdrawalTxs = transactions.filter(t => t.type === 'WITHDRAWAL');
  const pendingWdCount = withdrawalTxs.filter(t => t.status === TransactionStatus.PENDING).length;
  const doneWdCount = withdrawalTxs.filter(t => t.status === TransactionStatus.SUCCESS).length;
  const totalWdAmount = withdrawalTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDepositAmount = transactions.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="container mx-auto relative font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C]">Admin Control Panel</h2>
            <span className="bg-[#08B9ED]/15 text-[#08B9ED] text-xs font-bold px-2.5 py-0.5 rounded-full">
              Live Database Connected
            </span>
          </div>
          <p className="text-[#89939D] text-sm mt-0.5">
            Kelola transaksi member, persetujuan penarikan (Pending / Done / Reject), dan akun pengguna.
          </p>
        </div>
        <button 
          onClick={loadData} 
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-gray-300 text-[#45545C] text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          <ArrowPathIcon className={`w-4 h-4 text-[#08B9ED] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Memuat Data...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Action Toast Alert */}
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4 overflow-x-auto bg-[#FAFAFA]">
          <button
            className={`pb-3 px-4 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'transactions' 
                ? 'text-[#08B9ED] border-b-2 border-[#08B9ED]' 
                : 'text-[#89939D] hover:text-[#45545C]'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>Kelola Transaksi & Penarikan</span>
            {pendingWdCount > 0 && (
              <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {pendingWdCount} Pending
              </span>
            )}
          </button>

          <button
            className={`ml-2 pb-3 px-4 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'text-[#08B9ED] border-b-2 border-[#08B9ED]' 
                : 'text-[#89939D] hover:text-[#45545C]'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Daftar Member ({users.length})</span>
          </button>

          <button
            className={`ml-2 pb-3 px-4 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'settings' 
                ? 'text-[#08B9ED] border-b-2 border-[#08B9ED]' 
                : 'text-[#89939D] hover:text-[#45545C]'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <BuildingLibraryIcon className="w-4 h-4" />
            <span>Rekening Deposit Perusahaan</span>
          </button>
        </div>

        {/* ===================== TAB: TRANSACTIONS & WITHDRAWAL ===================== */}
        {activeTab === 'transactions' && (
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-[#89939D] text-xs font-semibold uppercase mb-1">
                  <span>Penarikan Pending</span>
                  <ClockIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-600 tabular-nums">{pendingWdCount}</span>
                  <span className="text-xs text-gray-500">perlu tindakan</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-[#89939D] text-xs font-semibold uppercase mb-1">
                  <span>Penarikan Selesai (Done)</span>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 tabular-nums">{doneWdCount}</span>
                  <span className="text-xs text-gray-500">penarikan disetujui</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-[#89939D] text-xs font-semibold uppercase mb-1">
                  <span>Total Volume Penarikan</span>
                  <ArrowUpTrayIcon className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-xl font-bold text-[#45545C] font-sans tabular-nums">
                  Rp {totalWdAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-[#89939D] text-xs font-semibold uppercase mb-1">
                  <span>Total Volume Deposit</span>
                  <ArrowDownTrayIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-[#45545C] font-sans tabular-nums">
                  Rp {totalDepositAmount.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* Type Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
                  <span className="text-xs text-[#89939D] font-bold uppercase mr-2 whitespace-nowrap">Tipe:</span>
                  <button
                    onClick={() => setTypeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      typeFilter === 'ALL'
                        ? 'bg-[#08B9ED] text-white shadow-sm'
                        : 'bg-white text-[#45545C] border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Semua ({transactions.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('WITHDRAWAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      typeFilter === 'WITHDRAWAL'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white text-[#45545C] border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>Penarikan (WD)</span>
                    <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
                      {withdrawalTxs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setTypeFilter('DEPOSIT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      typeFilter === 'DEPOSIT'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-[#45545C] border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Deposit ({transactions.filter(t => t.type === 'DEPOSIT').length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('TRANSFER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      typeFilter === 'TRANSFER'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-[#45545C] border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Transfer ({transactions.filter(t => t.type === 'TRANSFER').length})
                  </button>
                </div>

                {/* Status & Search Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <span className="text-xs text-[#89939D] font-bold uppercase mr-1 whitespace-nowrap">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-white border border-gray-300 text-[#45545C] text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#08B9ED] cursor-pointer"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="PENDING">PENDING (Menunggu)</option>
                      <option value="SUCCESS">DONE (Selesai)</option>
                      <option value="REJECTED">REJECTED (Ditolak)</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Cari ID, Member, Rekening..." 
                      className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#45545C] outline-none focus:border-[#08B9ED]"
                      value={trxSearch}
                      onChange={(e) => setTrxSearch(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Tanggal & ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Tipe & Nominal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Rekening Tujuan Penarikan / Detail
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Status Saat Ini
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#89939D] uppercase tracking-wider">
                      Atur Status (Admin Action)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredTransactions.map((t: Transaction) => {
                    const member = getUser(t.userId);
                    const wd = t.type === 'WITHDRAWAL' ? (t as WithdrawalTransaction) : null;
                    const isPending = t.status === TransactionStatus.PENDING;
                    const isDone = t.status === TransactionStatus.SUCCESS;
                    const isRejected = t.status === TransactionStatus.REJECTED;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Tanggal & ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-xs font-bold text-[#45545C] font-mono">
                            {t.id}
                          </div>
                          <div className="text-[11px] text-[#89939D]">
                            {new Date(t.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}, {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Member */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-[#45545C]">
                            {member?.fullName || 'Pengguna'}
                          </div>
                          <div className="text-[11px] text-[#89939D]">
                            {member?.email || t.userId}
                          </div>
                          {member && (
                            <div className="text-[10px] text-emerald-700 font-semibold font-sans tabular-nums mt-0.5">
                              Saldo akun: Rp {member.balance.toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>

                        {/* Tipe & Nominal */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="mb-1">
                            {t.type === 'WITHDRAWAL' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                WITHDRAWAL
                              </span>
                            )}
                            {t.type === 'DEPOSIT' && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                DEPOSIT
                              </span>
                            )}
                            {t.type === 'TRANSFER' && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                TRANSFER
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-[#45545C] font-sans tabular-nums">
                            Rp {t.amount.toLocaleString('id-ID')}
                          </div>
                        </td>

                        {/* Detail / Rekening Tujuan */}
                        <td className="px-4 py-3.5 text-xs">
                          {t.type === 'WITHDRAWAL' && wd ? (
                            <div className="space-y-0.5 bg-[#F8FAFC] p-2.5 rounded-lg border border-gray-200">
                              <div className="font-bold text-[#08B9ED] uppercase flex items-center gap-1">
                                <BuildingLibraryIcon className="w-3.5 h-3.5" />
                                <span>{wd.bankOrEwalletName || wd.method}</span>
                              </div>
                              <div className="font-mono text-sm font-bold text-[#45545C] tracking-wide">
                                {wd.accountNumber}
                              </div>
                              <div className="text-[11px] text-[#89939D] uppercase font-semibold">
                                a.n. {wd.accountHolderName}
                              </div>
                            </div>
                          ) : t.type === 'TRANSFER' ? (
                            <div className="text-xs text-[#45545C]">
                              <span className="text-[#89939D]">Tujuan: </span>
                              <span className="font-semibold">{(t as any).recipientEmail}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-[#89939D]">
                              Metode: <span className="text-[#45545C] font-semibold">{t.method}</span>
                            </div>
                          )}
                        </td>

                        {/* Status Saat Ini */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00C99A]/15 text-[#009E78] border border-[#00C99A]/30">
                              <CheckCircleIcon className="w-4 h-4 text-[#00C99A]" />
                              <span>DONE (Selesai)</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                              <ClockIcon className="w-4 h-4 text-amber-600" />
                              <span>PENDING</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F20D16]/10 text-[#F20D16] border border-[#F20D16]/30">
                              <XCircleIcon className="w-4 h-4 text-[#F20D16]" />
                              <span>DITOLAK</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                              {t.status}
                            </span>
                          )}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          {t.type !== 'TRANSFER' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Done Button */}
                              <button
                                onClick={() => handleStatusChange(t, TransactionStatus.SUCCESS)}
                                disabled={isDone || isRefreshing}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                  isDone 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                    : 'bg-[#00C99A] hover:bg-[#00B087] text-white shadow-emerald-500/20'
                                }`}
                                title="Ubah status menjadi DONE (Selesai)"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </button>

                              {/* Quick Pending Button */}
                              <button
                                onClick={() => handleStatusChange(t, TransactionStatus.PENDING)}
                                disabled={isPending || isRefreshing}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                  isPending
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                }`}
                                title="Kembalikan status ke PENDING"
                              >
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </button>

                              {/* Quick Reject Button */}
                              <button
                                onClick={() => handleStatusChange(t, TransactionStatus.REJECTED)}
                                disabled={isRejected || isRefreshing}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                  isRejected
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-[#F20D16] hover:bg-[#D10B12] text-white shadow-red-500/20'
                                }`}
                                title={t.type === 'WITHDRAWAL' ? 'Tolak dan kembalikan saldo ke member' : 'Tolak permintaan'}
                              >
                                <XCircleIcon className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Auto-Success</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Tidak ada transaksi yang cocok dengan filter atau pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: USERS MANAGEMENT ===================== */}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#45545C]">
                Profil Pengguna Terdaftar ({users.length})
              </h3>
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Tambah Pengguna Baru
              </Button>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">Saldo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#89939D] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#89939D] uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((u: User) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-[#89939D] font-mono tabular-nums">
                        {u.id.substring(0, 10)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#45545C] font-semibold">
                        {u.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#45545C]">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#45545C] font-sans font-bold tabular-nums">
                        Rp {u.balance.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isVerified ? 'bg-[#00C99A]/15 text-[#009E78]' : 'bg-[#F20D16]/15 text-[#D10B12]'
                        }`}>
                          {u.isVerified ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isAdmin ? 'bg-[#08B9ED]/15 text-[#08B9ED]' : 'bg-gray-100 text-[#89939D]'
                        }`}>
                          {u.isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex space-x-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openBalanceModal(u)}
                          >
                            Ubah Saldo
                          </Button>
                          <Button
                            variant={u.isVerified ? 'danger' : 'primary'}
                            size="sm"
                            onClick={async () => {
                              await updateUserVerification(u.id, !u.isVerified);
                              await loadData();
                            }}
                          >
                            {u.isVerified ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isRefreshing && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        Tidak ada pengguna di database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: COMPANY SETTINGS ===================== */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4 text-[#45545C]">
              Rekening Bank Perusahaan untuk Deposit Member
            </h3>
            <p className="text-sm text-[#89939D] mb-6">
              Rekening di bawah ini akan ditampilkan kepada member saat mereka melakukan deposit dana.
            </p>

            <div className="space-y-6">
              {bankList.map((bank, index) => (
                <div key={index} className="bg-[#F8FAFC] p-5 rounded-xl border border-gray-200 relative group">
                  <h4 className="font-bold text-base mb-4 text-[#45545C]">Rekening Bank #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      id={`adminBankName-${index}`}
                      label="Nama Bank"
                      type="text"
                      icon={<BuildingLibraryIcon />}
                      value={bank.bankName}
                      onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                    />
                    <Input
                      id={`adminAccountNumber-${index}`}
                      label="Nomor Rekening"
                      type="text"
                      icon={<CreditCardIcon />}
                      value={bank.accountNumber}
                      onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                      className="font-sans"
                    />
                    <Input
                      id={`adminAccountHolderName-${index}`}
                      label="Atas Nama Pemilik"
                      type="text"
                      icon={<BanknotesIcon />}
                      value={bank.accountHolderName}
                      onChange={(e) => handleBankChange(index, 'accountHolderName', e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => removeBank(index)} 
                    variant="danger" 
                    size="sm" 
                    className="absolute top-4 right-4 !p-2 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-6">
              <Button onClick={addBank} variant="secondary" size="md">
                <PlusIcon className="h-5 w-5 mr-2" /> Tambah Rekening Bank
              </Button>
              <Button onClick={handleUpdateBankInfo} variant="primary" size="lg" className="shadow-lg shadow-cyan-500/20">
                Simpan Semua Perubahan
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in font-sans">
            <div className="bg-[#F8FAFC] p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-[#45545C] text-lg font-bold flex items-center">
                <UserPlusIcon className="w-5 h-5 mr-2 text-[#08B9ED]" />
                Tambah Pengguna Baru
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {createError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  id="createFullName"
                  label="Nama Lengkap"
                  placeholder="Contoh: Budi Santoso"
                  value={createData.fullName}
                  onChange={(e) => setCreateData({...createData, fullName: e.target.value})}
                />
                <Input 
                  id="createEmail"
                  label="Email"
                  type="email"
                  placeholder="budi@example.com"
                  icon={<EnvelopeIcon />}
                  value={createData.email}
                  onChange={(e) => setCreateData({...createData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  id="createPhone"
                  label="Nomor Telepon"
                  placeholder="08123456789"
                  icon={<PhoneIcon />}
                  value={createData.phoneNumber}
                  onChange={(e) => setCreateData({...createData, phoneNumber: e.target.value})}
                />
                <Input 
                  id="createPassword"
                  label="Password"
                  type="password"
                  icon={<LockClosedIcon />}
                  value={createData.password}
                  onChange={(e) => setCreateData({...createData, password: e.target.value})}
                />
              </div>

              <Input 
                id="createBalance"
                label="Saldo Awal (Rp)"
                type="number"
                icon={<CurrencyDollarIcon />}
                value={createData.balance}
                onChange={(e) => setCreateData({...createData, balance: e.target.value})}
                className="font-sans"
              />

              <div className="flex flex-col space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={createData.isAdmin}
                    onChange={(e) => setCreateData({...createData, isAdmin: e.target.checked})}
                    className="w-4 h-4 rounded text-[#08B9ED] focus:ring-[#08B9ED]"
                  />
                  <span className="text-sm text-[#45545C] group-hover:text-[#08B9ED] transition-colors">Jadikan Administrator</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={createData.isVerified}
                    onChange={(e) => setCreateData({...createData, isVerified: e.target.checked})}
                    className="w-4 h-4 rounded text-[#08B9ED] focus:ring-[#08B9ED]"
                  />
                  <span className="text-sm text-[#45545C] group-hover:text-[#08B9ED] transition-colors">Otomatis Terverifikasi</span>
                </label>
              </div>

              <div className="mt-8 flex space-x-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsCreateModalOpen(false)} disabled={createLoading}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" fullWidth isLoading={createLoading} disabled={createLoading}>
                  Simpan & Buat Akun
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Edit Modal */}
      {isBalanceModalOpen && selectedUserForBalance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in font-sans">
            <div className="bg-[#F8FAFC] p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-[#45545C] text-lg font-bold flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 text-[#08B9ED]" />
                Ubah Saldo Member
              </h3>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleBalanceSubmit} className="p-6">
              <div className="mb-6 bg-[#F8FAFC] p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-[#89939D] mb-1 uppercase tracking-wider font-bold">Target Pengguna</p>
                <p className="text-[#45545C] font-bold text-base">{selectedUserForBalance.fullName}</p>
                <p className="text-[#89939D] text-xs">{selectedUserForBalance.email}</p>
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-[#89939D] mb-1 uppercase tracking-wider font-bold">Saldo Saat Ini</p>
                <p className="text-2xl font-sans font-black text-[#45545C]">
                  Rp {selectedUserForBalance.balance.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#89939D] mb-2 uppercase tracking-wider font-bold">Jenis Operasi Saldo</label>
                  <div className="flex space-x-3">
                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${
                      balanceOperation === 'add' 
                        ? 'bg-[#08B9ED]/10 border-[#08B9ED] text-[#08B9ED] font-bold shadow-sm' 
                        : 'border-gray-200 text-[#89939D] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="operation" 
                        value="add" 
                        checked={balanceOperation === 'add'} 
                        onChange={() => setBalanceOperation('add')}
                        className="hidden" 
                      />
                      <PlusIcon className="w-5 h-5 mb-1" />
                      <span className="text-xs">Tambah / Kurang</span>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center transition-all ${
                      balanceOperation === 'set' 
                        ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold shadow-sm' 
                        : 'border-gray-200 text-[#89939D] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="operation" 
                        value="set" 
                        checked={balanceOperation === 'set'} 
                        onChange={() => setBalanceOperation('set')}
                        className="hidden" 
                      />
                      <BanknotesIcon className="w-5 h-5 mb-1" />
                      <span className="text-xs">Tetapkan Mutlak</span>
                    </label>
                  </div>
                </div>

                <Input 
                  id="adminBalanceInput"
                  label={balanceOperation === 'add' ? "Jumlah Penyesuaian (Gunakan tanda - untuk mengurangi)" : "Total Saldo Baru"}
                  type="number"
                  placeholder="0"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  icon={<CurrencyDollarIcon />}
                  className="font-sans"
                />
              </div>

              <div className="mt-8 flex space-x-3">
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsBalanceModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" fullWidth className="shadow-lg shadow-cyan-500/20">
                  Konfirmasi Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
