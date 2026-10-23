import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  DepositTransaction,
  WithdrawalTransaction,
  TransactionStatus,
  NotificationItem,
  CompanyBankInfo,
  Transaction,
  User,
} from '../types';
import * as transactionService from '../services/transactionService';
import * as authService from '../services/authService';
import { useAuth } from './AuthContext';

export interface WithdrawResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

export interface DepositResult {
  success: boolean;
  transactionId?: string;
}

interface TransactionContextType {
  balance: number;
  accountMode: 'real' | 'demo';
  toggleAccountMode: () => void;
  depositHistory: DepositTransaction[];
  withdrawalHistory: WithdrawalTransaction[];
  notifications: NotificationItem[];
  companyBankInfoList: CompanyBankInfo[];
  isLoadingTransactions: boolean;
  transactionError: string | null;
  addNotification: (message: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  deposit: (amount: number) => Promise<boolean>;
  withdraw: (amount: number, method: string, bankOrEwalletName: string, accountNumber: string, accountHolderName: string) => Promise<WithdrawResult>;
  transfer: (recipientEmail: string, amount: number) => Promise<{ success: boolean; message: string }>;
  updateDepositStatus: (depositId: string, status: TransactionStatus) => Promise<boolean>;
  updateWithdrawalStatus: (withdrawalId: string, status: TransactionStatus) => Promise<boolean>;
  setCompanyBankInfoList: (info: CompanyBankInfo[]) => void;
  adminUpdateUserBalance: (userId: string, amount: number, type: 'set' | 'add') => Promise<void>;
  adminCreateUser: (userData: Omit<User, 'id' | 'username' | 'notifications'> & { password: string }) => Promise<boolean>;
  getAllTransactions: () => Promise<Transaction[]>;
  getAllUsers: () => Promise<User[]>;
  updateUserVerification: (userId: string, isVerified: boolean) => Promise<void>;
  fetchTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [accountMode, setAccountMode] = useState<'real' | 'demo'>('real');
  const [depositHistory, setDepositHistory] = useState<DepositTransaction[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [companyBankInfoList, setCompanyBankInfoListState] = useState<CompanyBankInfo[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (user) {
      setIsLoadingTransactions(true);
      setBalance(user.balance);
      try {
        const [deposits, withdrawals] = await Promise.all([
          transactionService.getDepositHistory(user.id),
          transactionService.getWithdrawalHistory(user.id)
        ]);
        setDepositHistory(deposits);
        setWithdrawalHistory(withdrawals);
        setNotifications(user.notifications || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoadingTransactions(false);
      }
    } else {
      setBalance(0);
      setDepositHistory([]);
      setWithdrawalHistory([]);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const loadBankInfo = async () => {
      const info = await transactionService.getCompanyBankInfoList();
      setCompanyBankInfoListState(info);
    };
    loadBankInfo();
  }, []);

  const toggleAccountMode = () => {
    setAccountMode(prevMode => (prevMode === 'real' ? 'demo' : 'real'));
  };

  const displayedBalance = accountMode === 'real' ? balance : 0;

  const addNotification = async (message: string) => {
    if (user) {
      await authService.addUserNotification(user.id, message);
      await refreshUser();
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (user) {
      await authService.updateUserNotification(user.id, notificationId, true);
      await refreshUser();
    }
  };

  const deposit = async (amount: number): Promise<boolean> => {
    if (accountMode === 'demo') {
      setTransactionError('Deposits are disabled in Demo mode.');
      return false;
    }
    if (!user) {
      setTransactionError('You must be logged in to deposit.');
      return false;
    }
    setIsLoadingTransactions(true);
    setTransactionError(null);
    const result = await transactionService.deposit(user.id, amount);
    if (result.success) {
      await refreshUser();
      await fetchTransactions();
    } else {
      setTransactionError('Deposit failed.');
    }
    setIsLoadingTransactions(false);
    return result.success;
  };

  const withdraw = async (
    amount: number,
    method: string,
    bankOrEwalletName: string,
    accountNumber: string,
    accountHolderName: string,
  ): Promise<WithdrawResult> => {
    if (accountMode === 'demo') {
      const msg = 'Penarikan dinonaktifkan pada akun Demo.';
      setTransactionError(msg);
      return { success: false, message: msg };
    }
    if (!user) {
      const msg = 'Anda harus login untuk melakukan penarikan.';
      setTransactionError(msg);
      return { success: false, message: msg };
    }
    if (user.balance < amount) {
      const msg = 'Saldo tidak mencukupi untuk melakukan penarikan.';
      setTransactionError(msg);
      return { success: false, message: msg };
    }

    setIsLoadingTransactions(true);
    setTransactionError(null);
    const result = await transactionService.withdraw(
      user.id,
      amount,
      method,
      bankOrEwalletName,
      accountNumber,
      accountHolderName,
    );
    if (result.success && result.transaction) {
      setBalance(prev => Math.max(0, prev - amount));
      await refreshUser();
      await fetchTransactions();
      setIsLoadingTransactions(false);
      return { success: true, transactionId: result.transaction.id };
    } else {
      const msg = result.message || 'Penarikan gagal diproses.';
      setTransactionError(msg);
      setIsLoadingTransactions(false);
      return { success: false, message: msg };
    }
  };

  const transfer = async (recipientEmail: string, amount: number): Promise<{ success: boolean; message: string }> => {
    if (accountMode === 'demo') {
      return { success: false, message: 'Transfer disabled in Demo mode.' };
    }
    if (!user) {
      return { success: false, message: 'Login required.' };
    }
    setIsLoadingTransactions(true);
    const result = await transactionService.transfer(user.id, recipientEmail, amount);
    if (result.success) {
      setBalance(prev => Math.max(0, prev - amount));
      await refreshUser();
      await fetchTransactions();
    } else {
      setTransactionError(result.message);
    }
    setIsLoadingTransactions(false);
    return result;
  };
  
  const adminUpdateUserBalance = async (userId: string, amount: number, type: 'set' | 'add') => {
    const users = await authService.getAllUsers();
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const newBalance = type === 'set' ? amount : targetUser.balance + amount;
      await authService.updateUserBalance(userId, newBalance);
      if (user?.id === userId) {
        await refreshUser();
        await fetchTransactions();
      }
    }
  };

  const adminCreateUser = async (userData: Omit<User, 'id' | 'username' | 'notifications'> & { password: string }): Promise<boolean> => {
    setIsLoadingTransactions(true);
    const newUser = await authService.adminCreateUser(userData);
    setIsLoadingTransactions(false);
    return !!newUser;
  };

  const updateDepositStatus = async (depositId: string, status: TransactionStatus): Promise<boolean> => {
    setIsLoadingTransactions(true);
    const success = await transactionService.updateDepositStatus(depositId, status);
    if (success) {
      await refreshUser();
      await fetchTransactions();
    } else {
      setTransactionError('Failed to update deposit status.');
    }
    setIsLoadingTransactions(false);
    return success;
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: TransactionStatus): Promise<boolean> => {
    setIsLoadingTransactions(true);
    const success = await transactionService.updateWithdrawalStatus(withdrawalId, status);
    if (success) {
      await refreshUser();
      await fetchTransactions();
    } else {
      setTransactionError('Failed to update withdrawal status.');
    }
    setIsLoadingTransactions(false);
    return success;
  };

  const updateCompanyBankInfoList = async (infoList: CompanyBankInfo[]) => {
    await transactionService.setCompanyBankInfoList(infoList);
    setCompanyBankInfoListState(infoList);
    if (user?.isAdmin) addNotification('Company bank information updated.');
  };

  const getAllTransactions = useCallback(async () => transactionService.getAllTransactions(), []);
  const getAllUsers = useCallback(async () => authService.getAllUsers(), []);
  
  const updateUserVerification = async (userId: string, isVerified: boolean) => {
    await authService.updateUserInfo({ id: userId, isVerified });
    await refreshUser();
  };

  const value = {
    balance: displayedBalance,
    accountMode,
    toggleAccountMode,
    depositHistory,
    withdrawalHistory,
    notifications,
    companyBankInfoList,
    isLoadingTransactions,
    transactionError,
    addNotification,
    markNotificationAsRead,
    deposit,
    withdraw,
    transfer,
    updateDepositStatus,
    updateWithdrawalStatus,
    setCompanyBankInfoList: updateCompanyBankInfoList,
    getAllTransactions,
    getAllUsers,
    updateUserVerification,
    adminUpdateUserBalance,
    adminCreateUser,
    fetchTransactions,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
