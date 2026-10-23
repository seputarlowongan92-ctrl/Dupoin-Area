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

const generateTransactionId = (prefix: 'WD' | 'DEP' | 'TRF'): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${dateStr}-${randomNum}`;
};

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
      account_holder_name: i.accountHolderName
    }));
    await supabase.from('company_bank_info').insert(dbItems);
  } catch {
    // local saved
  }
};

export const deposit = async (userId: string, amount: number): Promise<{ success: boolean; transaction?: DepositTransaction }> => {
  const txId = generateTransactionId('DEP');
  const newDeposit: DepositTransaction = {
    id: txId,
    userId,
    type: TransactionType.DEPOSIT,
    amount,
    method: 'Bank Transfer',
    status: TransactionStatus.PENDING,
    date: new Date().toISOString(),
    companyBankInfoList: getLocalBanks()
  };

  // Simpan ke cache lokal
  const localTxs = getLocalTransactions();
  saveLocalTransactions([newDeposit, ...localTxs.filter(t => t.id !== txId)]);

  // Notifikasi member
  await authService.addUserNotification(
    userId,
    `Deposit sebesar Rp ${amount.toLocaleString('id-ID')} (ID: ${txId}) sedang diproses. Mohon kirim bukti transfer ke admin.`
  );

  // Simpan ke database Supabase
  try {
    const { error: dbError } = await supabase
      .from('transactions')
      .insert([{
        id: newDeposit.id,
        user_id: userId,
        type: TransactionType.DEPOSIT,
        amount: amount,
        method: 'Bank Transfer',
        status: TransactionStatus.PENDING,
        date: newDeposit.date,
        created_at: new Date().toISOString()
      }]);
    if (dbError) {
      console.warn('Gagal menyimpan deposit ke database Supabase:', dbError);
    }
  } catch (err) {
    console.warn('Error saving deposit to database:', err);
  }

  return { success: true, transaction: newDeposit };
};

export const withdraw = async (
  userId: string,
  amount: number,
  method: string,
  bankOrEwalletName: string,
  accountNumber: string,
  accountHolderName: string,
): Promise<{ success: boolean; transaction?: WithdrawalTransaction; message?: string }> => {
  const user = await authService.getCurrentUser();
  if (!user || user.balance < amount) {
    return { success: false, message: 'Saldo tidak mencukupi untuk melakukan penarikan.' };
  }

  // Deduct balance user segera saat penarikan diajukan
  const newBalance = user.balance - amount;
  await authService.updateUserBalance(userId, newBalance);

  const txId = generateTransactionId('WD');
  const newWithdrawal: WithdrawalTransaction = {
    id: txId,
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

  // Simpan ke cache lokal
  const localTxs = getLocalTransactions();
  saveLocalTransactions([newWithdrawal, ...localTxs.filter(t => t.id !== txId)]);

  // Notifikasi member
  await authService.addUserNotification(
    userId,
    `Permintaan Penarikan (Withdrawal) Rp ${amount.toLocaleString('id-ID')} ke ${bankOrEwalletName} (${accountNumber}) dengan ID ${txId} sedang diproses.`
  );

  // Simpan ke database Supabase
  try {
    const { error: dbError } = await supabase
      .from('transactions')
      .insert([{
        id: newWithdrawal.id,
        user_id: userId,
        type: TransactionType.WITHDRAWAL,
        amount: amount,
        method: method,
        bank_or_ewallet_name: bankOrEwalletName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        status: TransactionStatus.PENDING,
        date: newWithdrawal.date,
        created_at: new Date().toISOString()
      }]);
    if (dbError) {
      console.warn('Gagal menyimpan penarikan ke database Supabase:', dbError);
    }
  } catch (err) {
    console.warn('Error saving withdrawal to database:', err);
  }

  return { success: true, transaction: newWithdrawal };
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

  const txId = generateTransactionId('TRF');
  const tx: TransferTransaction = {
    id: txId,
    userId,
    type: TransactionType.TRANSFER,
    amount,
    recipientEmail,
    status: TransactionStatus.SUCCESS,
    date: new Date().toISOString(),
    method: 'Internal Transfer'
  };

  const localTxs = getLocalTransactions();
  saveLocalTransactions([tx, ...localTxs.filter(t => t.id !== txId)]);

  await authService.addUserNotification(sender.id, `Transfer Berhasil: Mengirim Rp ${amount.toLocaleString('id-ID')} ke ${recipientEmail}.`);
  await authService.addUserNotification(recipient.id, `Dana Masuk: Menerima Rp ${amount.toLocaleString('id-ID')} dari ${sender.email}.`);

  try {
    const { error: dbError } = await supabase
      .from('transactions')
      .insert([{
        id: tx.id,
        user_id: userId,
        type: TransactionType.TRANSFER,
        amount: amount,
        method: 'Internal Transfer',
        bank_or_ewallet_name: recipientEmail,
        recipient_email: recipientEmail,
        status: TransactionStatus.SUCCESS,
        date: tx.date,
        created_at: new Date().toISOString()
      }]);
    if (dbError) {
      console.warn('Gagal menyimpan transfer ke database Supabase:', dbError);
    }
  } catch (err) {
    console.warn('Error saving transfer to database:', err);
  }

  return { success: true, message: 'Transfer berhasil diproses.' };
};

export const getDepositHistory = async (userId: string): Promise<DepositTransaction[]> => {
  let dbDeposits: DepositTransaction[] = [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', TransactionType.DEPOSIT)
      .order('date', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbDeposits = data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: TransactionType.DEPOSIT,
        amount: Number(t.amount),
        method: t.method || 'Bank Transfer',
        status: t.status as TransactionStatus,
        date: t.date,
        companyBankInfoList: [] 
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch deposits from database:', err);
  }

  const localTxs = getLocalTransactions().filter(
    t => t.userId === userId && t.type === TransactionType.DEPOSIT
  ) as DepositTransaction[];

  const map = new Map<string, DepositTransaction>();
  for (const item of localTxs) {
    map.set(item.id, item);
  }
  for (const item of dbDeposits) {
    map.set(item.id, item);
  }

  const result = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const allOtherLocal = getLocalTransactions().filter(
    t => !(t.userId === userId && t.type === TransactionType.DEPOSIT)
  );
  saveLocalTransactions([...result, ...allOtherLocal]);

  return result;
};

export const getWithdrawalHistory = async (userId: string): Promise<WithdrawalTransaction[]> => {
  let dbWithdrawals: WithdrawalTransaction[] = [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', TransactionType.WITHDRAWAL)
      .order('date', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbWithdrawals = data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: TransactionType.WITHDRAWAL,
        amount: Number(t.amount),
        method: t.method || 'Bank Transfer',
        bankOrEwalletName: t.bank_or_ewallet_name || '',
        accountNumber: t.account_number || '',
        accountHolderName: t.account_holder_name || '',
        status: t.status as TransactionStatus,
        date: t.date,
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch withdrawals from database:', err);
  }

  const localTxs = getLocalTransactions().filter(
    t => t.userId === userId && t.type === TransactionType.WITHDRAWAL
  ) as WithdrawalTransaction[];

  const map = new Map<string, WithdrawalTransaction>();
  for (const item of localTxs) {
    map.set(item.id, item);
  }
  for (const item of dbWithdrawals) {
    map.set(item.id, item);
  }

  const result = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const allOtherLocal = getLocalTransactions().filter(
    t => !(t.userId === userId && t.type === TransactionType.WITHDRAWAL)
  );
  saveLocalTransactions([...result, ...allOtherLocal]);

  return result;
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  let dbTransactions: Transaction[] = [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbTransactions = data.map((t: any) => {
        const base = {
          id: t.id,
          userId: t.user_id,
          amount: Number(t.amount),
          status: t.status as TransactionStatus,
          date: t.date,
          method: t.method,
        };
        if (t.type === TransactionType.DEPOSIT) {
          return { ...base, type: TransactionType.DEPOSIT } as DepositTransaction;
        } else if (t.type === TransactionType.TRANSFER) {
          return {
            ...base,
            type: TransactionType.TRANSFER,
            recipientEmail: t.recipient_email || t.bank_or_ewallet_name || ''
          } as TransferTransaction;
        } else {
          return {
            ...base,
            type: TransactionType.WITHDRAWAL,
            bankOrEwalletName: t.bank_or_ewallet_name || '',
            accountNumber: t.account_number || '',
            accountHolderName: t.account_holder_name || ''
          } as WithdrawalTransaction;
        }
      });
    }
  } catch (err) {
    console.warn('Failed to fetch all transactions from database:', err);
  }

  const localTxs = getLocalTransactions();
  const map = new Map<string, Transaction>();
  for (const item of localTxs) {
    map.set(item.id, item);
  }
  for (const item of dbTransactions) {
    map.set(item.id, item);
  }

  const result = Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  saveLocalTransactions(result);
  return result;
};

export const updateDepositStatus = async (depositId: string, status: TransactionStatus): Promise<boolean> => {
  const allTxs = await getAllTransactions();
  const tx = allTxs.find(t => t.id === depositId && t.type === TransactionType.DEPOSIT) as DepositTransaction | undefined;

  if (tx) {
    const oldStatus = tx.status;
    if (oldStatus === status) return true;

    const users = await authService.getAllUsers();
    const targetUser = users.find(u => u.id === tx.userId);

    if (targetUser) {
      if (oldStatus !== TransactionStatus.SUCCESS && status === TransactionStatus.SUCCESS) {
        // Approve deposit -> tambahkan saldo
        const newBalance = targetUser.balance + tx.amount;
        await authService.updateUserBalance(targetUser.id, newBalance);
        await authService.addUserNotification(
          targetUser.id,
          `Deposit Berhasil (DONE): Saldo sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah ditambahkan ke akun Anda.`
        );
      } else if (oldStatus === TransactionStatus.SUCCESS && status !== TransactionStatus.SUCCESS) {
        // Koreksi deposit yang tadinya sudah success -> kurangi saldo
        const newBalance = Math.max(0, targetUser.balance - tx.amount);
        await authService.updateUserBalance(targetUser.id, newBalance);
        await authService.addUserNotification(
          targetUser.id,
          `Koreksi Deposit: Status deposit (ID: ${tx.id}) diubah menjadi ${status}. Saldo disesuaikan.`
        );
      } else {
        await authService.addUserNotification(
          targetUser.id,
          `Status deposit (ID: ${tx.id}) diubah menjadi ${status} oleh Admin.`
        );
      }
    }

    tx.status = status;
    saveLocalTransactions(allTxs);

    try {
      const { error } = await supabase.from('transactions').update({ status }).eq('id', depositId);
      if (error) console.warn('Supabase update deposit error:', error);
    } catch (err) {
      console.warn('Supabase update deposit status exception:', err);
    }

    return true;
  }

  try {
    await supabase.from('transactions').update({ status }).eq('id', depositId);
    return true;
  } catch {
    return false;
  }
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: TransactionStatus): Promise<boolean> => {
  const allTxs = await getAllTransactions();
  const tx = allTxs.find(t => t.id === withdrawalId && t.type === TransactionType.WITHDRAWAL) as WithdrawalTransaction | undefined;

  if (tx) {
    const oldStatus = tx.status;
    if (oldStatus === status) return true;

    const isRefundedStatus = (s: TransactionStatus) => 
      [TransactionStatus.REJECTED, TransactionStatus.CANCELLED, TransactionStatus.FAILED].includes(s);

    const wasRefunded = isRefundedStatus(oldStatus);
    const isNowRefunded = isRefundedStatus(status);

    const users = await authService.getAllUsers();
    const targetUser = users.find(u => u.id === tx.userId);

    if (targetUser) {
      if (!wasRefunded && isNowRefunded) {
        // Penarikan ditolak/batal -> kembalikan saldo ke user!
        const refundedBalance = targetUser.balance + tx.amount;
        await authService.updateUserBalance(targetUser.id, refundedBalance);
        await authService.addUserNotification(
          targetUser.id,
          `Penarikan dana sebesar Rp ${tx.amount.toLocaleString('id-ID')} (ID: ${tx.id}) DITOLAK / DIBATALKAN oleh Admin. Saldo telah dikembalikan ke akun Anda.`
        );
      } else if (wasRefunded && !isNowRefunded) {
        // Sebelumnya ditolak (sudah di-refund), sekarang diaktifkan kembali ke PENDING atau SUCCESS -> kurangi saldo lagi
        const deductedBalance = Math.max(0, targetUser.balance - tx.amount);
        await authService.updateUserBalance(targetUser.id, deductedBalance);
        if (status === TransactionStatus.SUCCESS) {
          await authService.addUserNotification(
            targetUser.id,
            `Penarikan dana sebesar Rp ${tx.amount.toLocaleString('id-ID')} (ID: ${tx.id}) telah SELESAI (DONE) diproses ke ${tx.bankOrEwalletName} (${tx.accountNumber}).`
          );
        } else if (status === TransactionStatus.PENDING) {
          await authService.addUserNotification(
            targetUser.id,
            `Status penarikan dana sebesar Rp ${tx.amount.toLocaleString('id-ID')} (ID: ${tx.id}) diubah menjadi PENDING (Dalam Proses).`
          );
        }
      } else if (status === TransactionStatus.SUCCESS && oldStatus === TransactionStatus.PENDING) {
        // Pending -> Selesai / Done
        await authService.addUserNotification(
          targetUser.id,
          `Penarikan dana sebesar Rp ${tx.amount.toLocaleString('id-ID')} (ID: ${tx.id}) telah SELESAI (DONE) diproses ke ${tx.bankOrEwalletName} (${tx.accountNumber}).`
        );
      } else if (status === TransactionStatus.PENDING && oldStatus === TransactionStatus.SUCCESS) {
        // Done -> Pending
        await authService.addUserNotification(
          targetUser.id,
          `Status penarikan dana sebesar Rp ${tx.amount.toLocaleString('id-ID')} (ID: ${tx.id}) diubah kembali menjadi PENDING oleh Admin.`
        );
      }
    }

    tx.status = status;
    saveLocalTransactions(allTxs);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', withdrawalId);
      if (error) {
        console.warn('Supabase update withdrawal status error:', error);
      }
    } catch (err) {
      console.warn('Supabase update withdrawal status exception:', err);
    }

    return true;
  }

  try {
    await supabase.from('transactions').update({ status }).eq('id', withdrawalId);
    return true;
  } catch {
    return false;
  }
};