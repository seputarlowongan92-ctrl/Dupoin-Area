import { User, NotificationItem, SavedBankAccount } from '../types';
import { supabase } from './supabaseClient';

const LOCAL_STORAGE_SESSION_KEY = 'dupoin_active_session';
const LOCAL_STORAGE_USERS_KEY = 'dupoin_all_users';
const LOCAL_STORAGE_NOTIFS_KEY = 'dupoin_all_notifications';

// Default Accounts
const DEFAULT_USERS: Array<User & { password: string }> = [
  {
    id: 'user-demo-001',
    email: 'user@dupoin.com',
    fullName: 'Trader Dupoin',
    username: 'trader_dupoin',
    phoneNumber: '+62 812-3456-7890',
    isAdmin: false,
    isVerified: true,
    balance: 15000000,
    notifications: [
      {
        id: 'notif-1',
        userId: 'user-demo-001',
        message: 'Selamat datang di Platform Trading DUPOIN! Saldo akun Anda telah aktif.',
        date: new Date().toISOString(),
        read: false
      }
    ],
    password: 'password123'
  },
  {
    id: 'user-demo-002',
    email: 'demo@dupoin.com',
    fullName: 'Demo Trader',
    username: 'demotrader',
    phoneNumber: '+62 812-8888-9999',
    isAdmin: false,
    isVerified: true,
    balance: 15000000,
    notifications: [],
    password: 'password123'
  },
  {
    id: 'user-beta-003',
    email: 'betat5713@gmail.com',
    fullName: 'Beta Trader',
    username: 'betatrader',
    phoneNumber: '+62 813-7777-6666',
    isAdmin: false,
    isVerified: true,
    balance: 25000000,
    notifications: [],
    password: 'password123'
  },
  {
    id: 'admin-dupoin-001',
    email: 'admin@dupoin.com',
    fullName: 'Admin Dupoin Pro',
    username: 'admin_dupoin',
    phoneNumber: '+62 811-9876-5432',
    isAdmin: true,
    isVerified: true,
    balance: 100000000,
    notifications: [
      {
        id: 'notif-admin-1',
        userId: 'admin-dupoin-001',
        message: 'Sistem Admin Dupoin aktif dengan akses penuh ke manajemen member dan transaksi.',
        date: new Date().toISOString(),
        read: false
      }
    ],
    password: 'admin123'
  }
];

const getLocalUsers = (): Array<User & { password: string }> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

const saveLocalUsers = (users: Array<User & { password: string }>) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users', e);
  }
};

const getLocalSession = (): User | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const setLocalSession = (user: User | null) => {
  try {
    if (!user) {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to set session', e);
  }
};

const mapProfileToUser = (profile: any, authUser: any): User => {
  return {
    id: authUser?.id || profile?.id,
    email: profile.email || authUser?.email || '',
    fullName: profile.full_name || '',
    username: profile.username || (profile.email ? profile.email.split('@')[0] : 'user'),
    phoneNumber: profile.phone_number || '',
    isAdmin: profile.is_admin || false,
    isVerified: profile.is_verified ?? true,
    balance: (profile?.balance !== undefined && profile?.balance !== null) ? Number(profile.balance) : 15000000,
    notifications: [],
    profilePictureUrl: profile.profile_picture_url,
    savedBankAccounts: profile.saved_bank_accounts || profile.savedBankAccounts || [],
  };
};

export const register = async (userData: Omit<User, 'id' | 'username' | 'isAdmin' | 'isVerified' | 'balance' | 'notifications' | 'profilePictureUrl'> & { password: string }): Promise<{ user: User | null; error: string | null }> => {
  // Always save locally as fallback
  const localUsers = getLocalUsers();
  const existing = localUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existing) {
    return { user: null, error: 'Email sudah terdaftar. Silakan gunakan email lain atau langsung Login.' };
  }

  const newUser: User & { password: string } = {
    id: 'user-' + Date.now(),
    email: userData.email,
    fullName: userData.fullName,
    username: userData.email.split('@')[0],
    phoneNumber: userData.phoneNumber || '',
    isAdmin: false,
    isVerified: true,
    balance: 15000000,
    notifications: [
      {
        id: 'notif-welcome-' + Date.now(),
        userId: 'user-' + Date.now(),
        message: 'Selamat datang di DUPOIN! Akun Anda siap digunakan untuk trading.',
        date: new Date().toISOString(),
        read: false
      }
    ],
    password: userData.password
  };

  localUsers.push(newUser);
  saveLocalUsers(localUsers);

  // Attempt Supabase if available
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        }
      }
    });

    if (!authError && authData?.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        username: newUser.username,
        phone_number: userData.phoneNumber || '',
        balance: 15000000,
        is_verified: true,
        is_admin: false,
        saved_bank_accounts: [],
        created_at: new Date().toISOString()
      });
    } else {
      await supabase.from('profiles').upsert({
        id: newUser.id,
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        username: newUser.username,
        phone_number: userData.phoneNumber || '',
        balance: 15000000,
        is_verified: true,
        is_admin: false,
        saved_bank_accounts: [],
        created_at: new Date().toISOString()
      });
    }
  } catch {
    // Supabase optional fallback
  }

  setLocalSession(newUser);
  return { user: newUser, error: null };
};

export const login = async (identifier: string, passwordAttempt: string): Promise<{ user: User | null; error: string | null }> => {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Cek langsung ke tabel database `profiles`
  try {
    const { data: dbProfiles, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.${cleanId},phone_number.eq.${cleanId},username.ilike.${cleanId}`)
      .limit(1);

    if (!dbError && dbProfiles && dbProfiles.length > 0) {
      const dbUser = dbProfiles[0];
      if (dbUser.password) {
        if (dbUser.password === passwordAttempt) {
          const loggedInUser = mapProfileToUser(dbUser, null);
          setLocalSession(loggedInUser);

          // Sinkronisasi ke cache lokal
          const localUsers = getLocalUsers();
          const existingIdx = localUsers.findIndex(u => u.id === dbUser.id || u.email.toLowerCase() === dbUser.email?.toLowerCase());
          if (existingIdx >= 0) {
            localUsers[existingIdx] = { ...loggedInUser, password: passwordAttempt };
          } else {
            localUsers.push({ ...loggedInUser, password: passwordAttempt });
          }
          saveLocalUsers(localUsers);
          return { user: loggedInUser, error: null };
        } else {
          return { user: null, error: 'Password yang Anda masukkan salah.' };
        }
      }
    }
  } catch (err) {
    console.warn('Database profiles check fallback', err);
  }

  // 2. Coba Supabase cloud Auth jika tersedia
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: passwordAttempt,
    });

    if (!authError && authData?.user) {
      const profileResponse = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const loggedInUser = mapProfileToUser(profileResponse.data || { balance: 15000000 }, authData.user);
      setLocalSession(loggedInUser);
      return { user: loggedInUser, error: null };
    }
  } catch {
    // fallback
  }

  // 3. Fallback akun lokal bawaan (Demo Trader / Admin Dupoin)
  const localUsers = getLocalUsers();
  const matchedUser = localUsers.find(
    u => (u.email.toLowerCase() === cleanId || u.phoneNumber === identifier.trim() || u.username.toLowerCase() === cleanId)
  );

  if (matchedUser) {
    if (matchedUser.password === passwordAttempt) {
      setLocalSession(matchedUser);
      return { user: matchedUser, error: null };
    } else {
      return { user: null, error: 'Password yang Anda masukkan salah.' };
    }
  }

  return { user: null, error: 'Akun tidak terdaftar di database atau email/password salah.' };
};

export const logout = async (): Promise<void> => {
  setLocalSession(null);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Check local session first
  const sessionUser = getLocalSession();
  if (sessionUser) {
    // Refresh latest balance and notifications from local store
    const localUsers = getLocalUsers();
    const updated = localUsers.find(u => u.id === sessionUser.id);
    if (updated) {
      return updated;
    }
    return sessionUser;
  }

  // Fallback to Supabase session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profileData) return null;

    const user = mapProfileToUser(profileData, session.user);
    setLocalSession(user);
    return user;
  } catch {
    return null;
  }
};

export const updateUserNotification = async (userId: string, notificationId: string, read: boolean): Promise<void> => {
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  if (u && u.notifications) {
    u.notifications = u.notifications.map(n => n.id === notificationId ? { ...n, read } : n);
    saveLocalUsers(localUsers);
    const session = getLocalSession();
    if (session && session.id === userId) {
      session.notifications = u.notifications;
      setLocalSession(session);
    }
  }

  try {
    await supabase.from('notifications').update({ read }).eq('id', notificationId).eq('user_id', userId);
  } catch {
    // local fallback handled
  }
};

export const getUserNotifications = async (userId: string): Promise<NotificationItem[]> => {
  let dbNotifs: NotificationItem[] = [];
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbNotifs = data.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        message: n.message,
        date: n.date,
        read: Boolean(n.read),
      }));
    }
  } catch (err) {
    console.warn('Error fetching notifications from Supabase:', err);
  }

  const localUsers = getLocalUsers();
  const u = localUsers.find(usr => usr.id === userId);
  const localNotifs = u?.notifications || [];

  const map = new Map<string, NotificationItem>();
  for (const item of localNotifs) {
    map.set(item.id, item);
  }
  for (const item of dbNotifs) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const addUserNotification = async (userId: string, message: string): Promise<void> => {
  const notifId = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  const newNotif: NotificationItem = {
    id: notifId,
    userId,
    message,
    date: new Date().toISOString(),
    read: false
  };

  if (u) {
    u.notifications = [newNotif, ...(u.notifications || [])];
    saveLocalUsers(localUsers);
    const session = getLocalSession();
    if (session && session.id === userId) {
      session.notifications = u.notifications;
      setLocalSession(session);
    }
  }

  try {
    await supabase.from('notifications').insert([{ 
      id: notifId, 
      user_id: userId, 
      message, 
      date: newNotif.date, 
      read: false 
    }]);
  } catch {
    // local fallback handled
  }
};

export const updateUserBalance = async (userId: string, newBalance: number): Promise<void> => {
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  if (u) {
    u.balance = newBalance;
    saveLocalUsers(localUsers);
    const session = getLocalSession();
    if (session && session.id === userId) {
      session.balance = newBalance;
      setLocalSession(session);
    }
  }

  try {
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
  } catch {
    // local fallback handled
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && profiles && profiles.length > 0) {
      return profiles.map((p: any) => mapProfileToUser(p, null));
    }
  } catch {
    // fallback to local users
  }

  const localUsers = getLocalUsers();
  return localUsers.map(u => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
    phoneNumber: u.phoneNumber,
    isAdmin: u.isAdmin,
    isVerified: u.isVerified,
    balance: u.balance,
    notifications: u.notifications || [],
    profilePictureUrl: u.profilePictureUrl
  }));
};

export const updateUserInfo = async (updatedData: Partial<User>): Promise<void> => {
  if (!updatedData.id) return;
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === updatedData.id);
  if (u) {
    if (updatedData.fullName) u.fullName = updatedData.fullName;
    if (updatedData.phoneNumber) u.phoneNumber = updatedData.phoneNumber;
    if (updatedData.profilePictureUrl) u.profilePictureUrl = updatedData.profilePictureUrl;
    if (updatedData.isVerified !== undefined) u.isVerified = updatedData.isVerified;
    if (updatedData.savedBankAccounts !== undefined) u.savedBankAccounts = updatedData.savedBankAccounts;
    saveLocalUsers(localUsers);
    const session = getLocalSession();
    if (session && session.id === updatedData.id) {
      Object.assign(session, updatedData);
      setLocalSession(session);
    }
  }

  try {
    const updates: any = {};
    if (updatedData.fullName) updates.full_name = updatedData.fullName;
    if (updatedData.phoneNumber) updates.phone_number = updatedData.phoneNumber;
    if (updatedData.profilePictureUrl) updates.profile_picture_url = updatedData.profilePictureUrl;
    if (updatedData.isVerified !== undefined) updates.is_verified = updatedData.isVerified;
    if (updatedData.savedBankAccounts !== undefined) updates.saved_bank_accounts = updatedData.savedBankAccounts;
    await supabase.from('profiles').update(updates).eq('id', updatedData.id);
  } catch {
    // handled locally
  }
};

export const addSavedBankAccount = async (
  userId: string,
  accountData: { bankName: string; accountNumber: string; accountHolderName: string; isPrimary?: boolean }
): Promise<SavedBankAccount | null> => {
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  if (!u) return null;

  const existingAccounts: SavedBankAccount[] = u.savedBankAccounts || [];
  const isFirst = existingAccounts.length === 0;
  const shouldBePrimary = isFirst ? true : Boolean(accountData.isPrimary);

  let updatedList = existingAccounts;
  if (shouldBePrimary) {
    updatedList = updatedList.map(acc => ({ ...acc, isPrimary: false }));
  }

  const newAccount: SavedBankAccount = {
    id: 'bank-acc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    bankName: accountData.bankName.trim(),
    accountNumber: accountData.accountNumber.trim(),
    accountHolderName: accountData.accountHolderName.trim().toUpperCase(),
    isPrimary: shouldBePrimary,
    createdAt: new Date().toISOString(),
  };

  updatedList = [newAccount, ...updatedList];
  u.savedBankAccounts = updatedList;
  saveLocalUsers(localUsers);

  const session = getLocalSession();
  if (session && session.id === userId) {
    session.savedBankAccounts = updatedList;
    setLocalSession(session);
  }

  try {
    await supabase.from('profiles').update({ saved_bank_accounts: updatedList }).eq('id', userId);
  } catch {
    // handled locally
  }

  return newAccount;
};

export const removeSavedBankAccount = async (userId: string, accountId: string): Promise<boolean> => {
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  if (!u || !u.savedBankAccounts) return false;

  let updatedList = u.savedBankAccounts.filter(acc => acc.id !== accountId);
  // If the deleted account was primary, set the first remaining one as primary
  if (updatedList.length > 0 && !updatedList.some(acc => acc.isPrimary)) {
    updatedList[0] = { ...updatedList[0], isPrimary: true };
  }

  u.savedBankAccounts = updatedList;
  saveLocalUsers(localUsers);

  const session = getLocalSession();
  if (session && session.id === userId) {
    session.savedBankAccounts = updatedList;
    setLocalSession(session);
  }

  try {
    await supabase.from('profiles').update({ saved_bank_accounts: updatedList }).eq('id', userId);
  } catch {
    // handled locally
  }

  return true;
};

export const setPrimarySavedBankAccount = async (userId: string, accountId: string): Promise<boolean> => {
  const localUsers = getLocalUsers();
  const u = localUsers.find(user => user.id === userId);
  if (!u || !u.savedBankAccounts) return false;

  const updatedList = u.savedBankAccounts.map(acc => ({
    ...acc,
    isPrimary: acc.id === accountId,
  }));

  u.savedBankAccounts = updatedList;
  saveLocalUsers(localUsers);

  const session = getLocalSession();
  if (session && session.id === userId) {
    session.savedBankAccounts = updatedList;
    setLocalSession(session);
  }

  try {
    await supabase.from('profiles').update({ saved_bank_accounts: updatedList }).eq('id', userId);
  } catch {
    // handled locally
  }

  return true;
};

export const adminCreateUser = async (userData: Omit<User, 'id' | 'username' | 'notifications'> & { password: string }): Promise<User | null> => {
  const localUsers = getLocalUsers();
  const userId = 'user-' + Date.now();
  const username = userData.email.split('@')[0];

  const newUser: User & { password: string } = {
    id: userId,
    email: userData.email,
    fullName: userData.fullName,
    username,
    phoneNumber: userData.phoneNumber || '',
    isAdmin: userData.isAdmin || false,
    isVerified: userData.isVerified ?? true,
    balance: userData.balance || 0,
    notifications: [
      {
        id: 'notif-' + Date.now(),
        userId,
        message: 'Akun Anda telah dibuat oleh Administrator.',
        date: new Date().toISOString(),
        read: false
      }
    ],
    password: userData.password,
    savedBankAccounts: []
  };

  localUsers.push(newUser);
  saveLocalUsers(localUsers);

  // LANGSUNG SIMPAN KE TABEL DATABASE `profiles`
  try {
    const { error: dbError } = await supabase.from('profiles').insert([
      {
        id: userId,
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        username,
        phone_number: userData.phoneNumber || '',
        is_admin: userData.isAdmin || false,
        is_verified: userData.isVerified ?? true,
        balance: userData.balance || 0,
        saved_bank_accounts: [],
        created_at: new Date().toISOString()
      }
    ]);

    if (dbError) {
      console.warn('Gagal menyimpan user baru ke tabel profiles:', dbError);
    }
  } catch (dbErr) {
    console.warn('Error saat insert ke tabel profiles:', dbErr);
  }

  // Daftarkan juga ke Supabase Auth jika cloud aktif
  try {
    await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: { full_name: userData.fullName } }
    });
  } catch {
    // handled
  }

  return newUser;
};

export const verifyEmail = async (email: string) => true;
