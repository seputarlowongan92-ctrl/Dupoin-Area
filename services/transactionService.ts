import {
  Transaction,
  DepositTransaction,
  WithdrawalTransaction,
  TransferTransaction,
  TransactionType,
  TransactionStatus,
  CompanyBankInfo,
} from '../types';
import { supabase } from './supabaseClient';
import * as authService from './authService';

const LOCAL_STORAGE_TRANSACTIONS_KEY = 'dupoin_transactions';
const LOCAL_STORAGE_BANKS_KEY = 'dupoin_bank_info';

const DEFAULT_BANKS: CompanyBankInfo[] = [
  {
    id: 'bank-bca-01',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830192831',
    accountHolderName: 'PT DUPOIN FUTURES INDONESIA'
  },
  {
    id: 'bank-mandiri-02',
    bankName: 'Bank Mandiri',
    accountNumber: '1200098765432',
    accountHolderName: 'PT DUPOIN FUTURES INDONESIA'
  },
  {
    id: 'bank-bri-03',
    bankName: 'Bank Rakyat Indonesia (BRI)',
    accountNumber: '034101000888301',
    accountHolderName: 'PT DUPOIN FUTURES INDONESIA'
  }
];

const getLocalBanks = (): CompanyBankInfo[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BANKS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_BANKS_KEY, JSON.stringify(DEFAULT_BANKS));
      return DEFAULT_BANKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BANKS;
  } catch {
    return DEFAULT_BANKS;
  }
};

const getLocalTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalTransactions = (txs: Transaction[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions locally', e);
  }
};

export const getCompanyBankInfoList = async (): Promise<CompanyBankInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('company_bank_info')
      .select('*');
    
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        bankName: item.bank_name,
        accountNumber: item.account_number,
        accountHolderName: item.account_holder_name
      }));
    }
  } catch {
    // fallback
  }
  return getLocalBanks();
};

export const setCompanyBankInfoList = async (infoList: CompanyBankInfo[]): Promise<void> => {
  localStorage.setItem(LOCAL_STORAGE_BANKS_KEY, JSON.stringify(infoList));
  try {
    await supabase.from('company_bank_info').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    const dbItems = infoList.map(i => ({
      bank_name: i.bankName,
      account_number: i.accountNumber,
      accountHolderName: i.accountHolderName
    }));
    await supabase.from('company_bank_info').insert(dbItems);
  } catch {
    // local saved
  }
};

export const deposit = async (userId: string, amount: number): Promise<boolean> => {
  const newDeposit: DepositTransaction = {
    id: 'dep-' + Date.now(),
    userId,
    type: TransactionType.DEPOSIT,
    amount,
    method: 'Bank Transfer',
    status: TransactionStatus.PENDING,
    date: new Date().toISOString(),
    companyBankInfoList: getLocalBanks()
  };

  const localTxs = getLocalTransactions();
  saveLocalTransactions([newDeposit, ...localTxs]);

  await authService.addUserNotification(userId, `Deposit sebesar Rp ${amount.toLocaleString('en-US')} sedang diproses. Mohon kirim bukti transfer ke admin.`);

  try {
    await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        type: TransactionType.DEPOSIT,
        amount: amount,
        method: 'Bank Transfer',
        status: TransactionStatus.PENDING,
        date: newDeposit.date,
      }]);
  } catch {
    // handled locally
  }

  return true;
};

export const withdraw = async (
  userId: string,
  amount: number,
  method: string,
  bankOrEwalletName: string,
  accountNumber: string,
  accountHolderName: string,
): Promise<boolean> => {
  const user = await authService.getCurrentUser();
  if (!user || user.balance < amount) return false;

  // Deduct balance
  const newBalance = user.balance - amount;
  await authService.updateUserBalance(userId, newBalance);

  const newWithdrawal: WithdrawalTransaction = {
    id: 'wd-' + Date.now(),
    userId,
    type: TransactionType.WITHDRAWAL,
    amount,
    method,
    bankOrEwalletName,
    accountNumber,
    accountHolderName,
    status: TransactionStatus.PENDING,
    date: new Date().toISOString()
  };

  const localTxs = getLocalTransactions();
  saveLocalTransactions([newWithdrawal, ...localTxs]);

  await authService.addUserNotification(userId, `Permintaan Penarikan (Withdrawal) sebesar Rp ${amount.toLocaleString('en-US')} sedang diproses.`);

  try {
    await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        type: TransactionType.WITHDRAWAL,
        amount: amount,
        method: method,
        bank_or_ewallet_name: bankOrEwalletName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        status: TransactionStatus.PENDING,
        date: newWithdrawal.date,
      }]);
  } catch {
    // handled locally
  }

  return true;
};

export const transfer = async (userId: string, recipientEmail: string, amount: number): Promise<{ success: boolean; message: string }> => {
  const sender = await authService.getCurrentUser();
  if (!sender || sender.balance < amount) {
    return { success: false, message: 'Saldo tidak mencukupi.' };
  }

  const allUsers = await authService.getAllUsers();
  const recipient = allUsers.find(u => u.email.toLowerCase() === recipientEmail.trim().toLowerCase());

  if (!recipient) {
    return { success: false, message: 'Email penerima tidak ditemukan di sistem.' };
  }

  // Deduct sender & add to recipient
  await authService.updateUserBalance(sender.id, sender.balance - amount);
  await authService.updateUserBalance(recipient.id, recipient.balance + amount);

  const tx: TransferTransaction = {
    id: 'trf-' + Date.now(),
    userId,
    type: TransactionType.TRANSFER,
    amount,
    recipientEmail,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    method: 'Internal Transfer'
  };

  const localTxs = getLocalTransactions();
  saveLocalTransactions([tx, ...localTxs]);

  await authService.addUserNotification(sender.id, `Transfer Berhasil: Mengirim Rp ${amount.toLocaleString('en-US')} ke ${recipientEmail}.`);
  await authService.addUserNotification(recipient.id, `Dana Masuk: Menerima Rp ${amount.toLocaleString('en-US')} dari ${sender.email}.`);

  return { success: true, message: 'Transfer berhasil diproses.' };
};

export const getDepositHistory = async (userId: string): Promise<DepositTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', TransactionType.DEPOSIT)
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: TransactionType.DEPOSIT,
        amount: t.amount,
        method: t.method,
        status: t.status,
        date: t.date,
        companyBankInfoList: [] 
      }));
    }
  } catch {
    // fallback
  }

  const localTxs = getLocalTransactions();
  return localTxs.filter(t => t.userId === userId && t.type === TransactionType.DEPOSIT) as DepositTransaction[];
};

export const getWithdrawalHistory = async (userId: string): Promise<WithdrawalTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', TransactionType.WITHDRAWAL)
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: TransactionType.WITHDRAWAL,
        amount: t.amount,
        method: t.method,
        bankOrEwalletName: t.bank_or_ewallet_name,
        accountNumber: t.account_number,
        accountHolderName: t.account_holder_name,
        status: t.status,
        date: t.date,
      }));
    }
  } catch {
    // fallback
  }

  const localTxs = getLocalTransactions();
  return localTxs.filter(t => t.userId === userId && t.type === TransactionType.WITHDRAWAL) as WithdrawalTransaction[];
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((t: any) => {
        const base = {
          id: t.id,
          userId: t.user_id,
          amount: t.amount,
          status: t.status,
          date: t.date,
          method: t.method,
        };
        if (t.type === TransactionType.DEPOSIT) {
          return { ...base, type: TransactionType.DEPOSIT } as DepositTransaction;
        } else if (t.type === TransactionType.TRANSFER) {
          return { ...base, type: TransactionType.TRANSFER, recipientEmail: t.bank_or_ewallet_name } as TransferTransaction;
        } else {
          return {
            ...base,
            type: TransactionType.WITHDRAWAL,
            bankOrEwalletName: t.bank_or_ewallet_name,
            accountNumber: t.account_number,
            accountHolderName: t.account_holder_name
          } as WithdrawalTransaction;
        }
      });
    }
  } catch {
    // fallback
  }

  return getLocalTransactions();
};

export const updateDepositStatus = async (depositId: string, status: TransactionStatus): Promise<boolean> => {
  const localTxs = getLocalTransactions();
  const tx = localTxs.find(t => t.id === depositId);
  if (tx && tx.type === TransactionType.DEPOSIT) {
    const oldStatus = tx.status;
    tx.status = status;
    saveLocalTransactions(localTxs);

    const users = await authService.getAllUsers();
    const u = users.find(usr => usr.id === tx.userId);
    if (u) {
      if (oldStatus !== TransactionStatus.SUCCESS && status === TransactionStatus.SUCCESS) {
        await authService.updateUserBalance(u.id, u.balance + tx.amount);
        await authService.addUserNotification(u.id, `Deposit Berhasil: Saldo Rp ${tx.amount.toLocaleString('en-US')} telah ditambahkan.`);
      } else if (oldStatus === TransactionStatus.SUCCESS && status !== TransactionStatus.SUCCESS) {
        await authService.updateUserBalance(u.id, Math.max(0, u.balance - tx.amount));
        await authService.addUserNotification(u.id, `Koreksi Deposit: Status deposit diubah menjadi ${status}. Saldo disesuaikan.`);
      }
    }
  }

  try {
    await supabase.from('transactions').update({ status }).eq('id', depositId);
  } catch {
    // handled
  }

  return true;
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: TransactionStatus): Promise<boolean> => {
  const localTxs = getLocalTransactions();
  const tx = localTxs.find(t => t.id === withdrawalId);
  if (tx && tx.type === TransactionType.WITHDRAWAL) {
    const isRefundedStatus = (s: TransactionStatus) => 
      [TransactionStatus.REJECTED, TransactionStatus.CANCELLED, TransactionStatus.FAILED].includes(s);

    const currentlyRefunded = isRefundedStatus(tx.status);
    const willBeRefunded = isRefundedStatus(status);

    tx.status = status;
    saveLocalTransactions(localTxs);

    const users = await authService.getAllUsers();
    const u = users.find(usr => usr.id === tx.userId);
    if (u) {
      if (currentlyRefunded && !willBeRefunded) {
        await authService.updateUserBalance(u.id, Math.max(0, u.balance - tx.amount));
      } else if (!currentlyRefunded && willBeRefunded) {
        await authService.updateUserBalance(u.id, u.balance + tx.amount);
      }
    }
  }

  try {
    await supabase.from('transactions').update({ status }).eq('id', withdrawalId);
  } catch {
    // handled
  }

  return true;
};