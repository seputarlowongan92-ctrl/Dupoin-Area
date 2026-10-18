import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  PhoneIcon, 
  CameraIcon, 
  CreditCardIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  PlusCircleIcon, 
  BuildingLibraryIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { BANK_OPTIONS, E_WALLET_OPTIONS } from '../../constants';

const SettingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'bank' ? 'bank' : 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'bank'>(initialTab);

  const { 
    user, 
    isLoading, 
    updateProfile, 
    error,
    savedBankAccounts,
    addBankAccount,
    removeBankAccount,
    setPrimaryBankAccount
  } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePictureUrl || null);
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phoneNumber?: string; profilePicture?: string; api?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bank Account Form State
  const [selectedBank, setSelectedBank] = useState<string>(BANK_OPTIONS[0] || 'Bank Central Asia (BCA)');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newAccountHolderName, setNewAccountHolderName] = useState<string>(user?.fullName || '');
  const [isPrimaryAccount, setIsPrimaryAccount] = useState<boolean>(true);
  const [bankFormErrors, setBankFormErrors] = useState<{ bank?: string; accountNumber?: string; holderName?: string }>({});
  const [bankSuccessMessage, setBankSuccessMessage] = useState<string | null>(null);
  const [isSubmittingBank, setIsSubmittingBank] = useState<boolean>(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'bank' && activeTab !== 'bank') {
      setActiveTab('bank');
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhoneNumber(user.phoneNumber);
      setProfilePicture(user.profilePictureUrl || null);
      if (!newAccountHolderName) {
        setNewAccountHolderName(user.fullName);
      }
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      setFormErrors(prev => ({ ...prev, api: error }));
    } else {
      setFormErrors(prev => ({ ...prev, api: undefined }));
    }
  }, [error]);

  const handleTabChange = (tab: 'profile' | 'bank') => {
    setActiveTab(tab);
    setSearchParams(tab === 'bank' ? { tab: 'bank' } : {});
    setSuccessMessage(null);
    setBankSuccessMessage(null);
  };

  const validateProfile = (): boolean => {
    const newErrors: typeof formErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Nama lengkap tidak boleh kosong.';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor telepon tidak boleh kosong.';
    } else if (!/^\d+$/.test(phoneNumber.replace(/[\s+-]/g, ''))) {
      newErrors.phoneNumber = 'Nomor telepon harus berupa angka yang valid.';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE_MB = 2;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
      const MIN_WIDTH = 200;
      const MIN_HEIGHT = 200;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormErrors(prev => ({ ...prev, profilePicture: 'Format tidak didukung. Gunakan JPG, PNG, atau GIF.' }));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormErrors(prev => ({ ...prev, profilePicture: `Ukuran file harus kurang dari ${MAX_FILE_SIZE_MB}MB.` }));
        return;
      }

      const reader = new FileReader();
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (image.width < MIN_WIDTH || image.height < MIN_HEIGHT) {
          setFormErrors(prev => ({ ...prev, profilePicture: `Dimensi gambar minimal ${MIN_WIDTH}x${MIN_HEIGHT} pixel.` }));
          return;
        }

        reader.onloadend = () => {
          setProfilePicture(reader.result as string);
          setFormErrors(prev => ({ ...prev, profilePicture: undefined, api: undefined }));
        };
        reader.readAsDataURL(file);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setFormErrors(prev => ({ ...prev, profilePicture: 'Gagal memproses file gambar.' }));
      };

      image.src = objectUrl;
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setFormErrors({});

    if (!user) {
      setFormErrors(prev => ({ ...prev, api: 'Sesi pengguna tidak valid.' }));
      return;
    }

    if (!validateProfile()) {
      return;
    }

    const success = await updateProfile({ fullName, phoneNumber, profilePictureUrl: profilePicture || undefined });

    if (success) {
      setSuccessMessage('Profil akun berhasil diperbarui!');
    } else {
      setFormErrors(prev => ({ ...prev, api: formErrors.api || error || 'Gagal memperbarui profil.' }));
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccessMessage(null);
    const errors: typeof bankFormErrors = {};

    if (!selectedBank.trim()) {
      errors.bank = 'Pilih nama bank atau e-wallet.';
    }
    const cleanAccNo = newAccountNumber.replace(/\s+/g, '');
    if (!cleanAccNo) {
      errors.accountNumber = 'Nomor rekening tidak boleh kosong.';
    } else if (cleanAccNo.length < 5) {
      errors.accountNumber = 'Nomor rekening terlalu pendek (minimal 5 digit).';
    }

    if (!newAccountHolderName.trim()) {
      errors.holderName = 'Nama pemilik rekening tidak boleh kosong.';
    }

    if (Object.keys(errors).length > 0) {
      setBankFormErrors(errors);
      return;
    }

    setBankFormErrors({});
    setIsSubmittingBank(true);

    const ok = await addBankAccount({
      bankName: selectedBank,
      accountNumber: newAccountNumber.trim(),
      accountHolderName: newAccountHolderName.trim().toUpperCase(),
      isPrimary: isPrimaryAccount || (savedBankAccounts && savedBankAccounts.length === 0)
    });

    setIsSubmittingBank(false);

    if (ok) {
      setBankSuccessMessage(`Rekening ${selectedBank} berhasil disimpan untuk penarikan dana!`);
      setNewAccountNumber('');
      setIsPrimaryAccount(false);
    } else {
      setBankFormErrors({ accountNumber: 'Gagal menyimpan rekening. Silakan coba lagi.' });
    }
  };

  const handleRemoveAccount = async (accountId: string, bankName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus rekening ${bankName} dari daftar rekening penarikan?`)) {
      const ok = await removeBankAccount(accountId);
      if (ok) {
        setBankSuccessMessage(`Rekening berhasil dihapus.`);
      }
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    const ok = await setPrimaryBankAccount(accountId);
    if (ok) {
      setBankSuccessMessage(`Rekening utama penarikan berhasil diperbarui.`);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C] tracking-tight">Pengaturan Akun</h2>
        <p className="text-[#89939D] mt-1 text-sm leading-relaxed">
          Kelola informasi profil pribadi serta simpan rekening bank/e-wallet untuk penarikan dana (withdrawal).
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-2 sm:px-6 pt-3 shadow-xs">
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
            activeTab === 'profile'
              ? 'border-[#08B9ED] text-[#08B9ED]'
              : 'border-transparent text-[#89939D] hover:text-[#45545C]'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profil Saya</span>
        </button>

        <button
          onClick={() => handleTabChange('bank')}
          className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
            activeTab === 'bank'
              ? 'border-[#08B9ED] text-[#08B9ED]'
              : 'border-transparent text-[#89939D] hover:text-[#45545C]'
          }`}
        >
          <BuildingLibraryIcon className="w-4 h-4" />
          <span>Rekening Penarikan</span>
          {savedBankAccounts && savedBankAccounts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-[#08B9ED]/15 text-[#08B9ED]">
              {savedBankAccounts.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Profil Pengguna */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-xl shadow-sm animate-fade-in">
          <h3 className="text-lg font-bold text-[#45545C] mb-2">Edit Profil Pengguna</h3>
          <p className="text-[#89939D] text-xs sm:text-sm mb-6">
            Perbarui foto profil, nama lengkap akun, dan nomor kontak Anda.
          </p>

          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
            {formErrors.api && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3.5 rounded-lg text-sm">
                {formErrors.api}
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3.5 rounded-lg text-sm flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-[#45545C] text-xs font-bold uppercase tracking-wider mb-2">
                Foto Profil
              </label>
              <div className="flex flex-wrap items-center gap-5">
                <div className="relative shrink-0">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="h-20 w-20 rounded-full object-cover border-2 border-[#08B9ED] shadow-sm" 
                    />
                  ) : (
                    <UserIcon className="h-20 w-20 text-gray-400 rounded-full border-2 border-gray-200 p-2 bg-slate-50" />
                  )}
                </div>
                <div>
                  <label 
                    htmlFor="profilePictureInput" 
                    className="cursor-pointer inline-flex items-center gap-2 bg-[#08B9ED] hover:bg-[#07A6D5] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors shadow-xs active:scale-95"
                  >
                    <CameraIcon className="h-4 w-4" />
                    <span>Upload Foto Baru</span>
                  </label>
                  <input
                    id="profilePictureInput"
                    type="file"
                    accept="image/jpeg, image/png, image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-[#89939D]">
                    Format: JPG, PNG, atau GIF. Ukuran maks 2MB (Min 200x200px).
                  </p>
                </div>
              </div>
              {formErrors.profilePicture && (
                <p className="mt-2 text-xs text-red-600 font-medium">{formErrors.profilePicture}</p>
              )}
            </div>

            <Input
              id="fullName"
              label="Nama Lengkap"
              type="text"
              icon={<UserIcon className="w-5 h-5 text-gray-400" />}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFormErrors(prev => ({ ...prev, fullName: undefined, api: undefined }));
              }}
              error={formErrors.fullName}
              disabled={isLoading}
            />

            <Input
              id="phoneNumber"
              label="Nomor Telepon / WhatsApp"
              type="tel"
              icon={<PhoneIcon className="w-5 h-5 text-gray-400" />}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setFormErrors(prev => ({ ...prev, phoneNumber: undefined, api: undefined }));
              }}
              error={formErrors.phoneNumber}
              disabled={isLoading}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
                Simpan Perubahan Profil
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Rekening Penarikan */}
      {activeTab === 'bank' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Banner */}
          <div className="bg-[#08B9ED]/10 border border-[#08B9ED]/30 rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
            <BuildingLibraryIcon className="w-6 h-6 text-[#08B9ED] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[#45545C] font-bold text-sm sm:text-base">
                Kelola Rekening Penarikan (Withdrawal)
              </h4>
              <p className="text-[#556973] text-xs sm:text-sm mt-0.5 leading-relaxed">
                Rekening bank atau e-wallet yang Anda simpan di sini akan otomatis muncul sebagai opsi penarikan di halaman <strong>Withdrawal</strong>. 
                Dengan menyimpan rekening, Anda tidak perlu mengetik nomor rekening dan nama berulang kali.
              </p>
            </div>
          </div>

          {bankSuccessMessage && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl text-sm flex items-center gap-2 shadow-xs">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{bankSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Tambah Rekening Baru (Left side) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[#45545C] font-bold text-base flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5 text-[#08B9ED]" />
                    <span>Tambah Rekening Baru</span>
                  </h3>
                </div>

                <form onSubmit={handleAddBankAccount} className="p-5 space-y-4">
                  {/* Select Bank / E-Wallet */}
                  <div>
                    <label className="block text-[#89939D] text-xs font-semibold mb-1.5">
                      Pilih Bank atau E-Wallet
                    </label>
                    <select
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] cursor-pointer"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <optgroup label="🏦 Bank Nasional">
                        {BANK_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </optgroup>
                      <optgroup label="📱 E-Wallet">
                        {E_WALLET_OPTIONS.map(e => (
                          <option key={e} value={e}>E-Wallet {e}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-[#89939D] text-xs font-semibold mb-1.5">
                      Nomor Rekening / No. HP E-Wallet
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 8370186031 atau 08123456789"
                      value={newAccountNumber}
                      onChange={(e) => {
                        setNewAccountNumber(e.target.value);
                        if (bankFormErrors.accountNumber) {
                          setBankFormErrors(prev => ({ ...prev, accountNumber: undefined }));
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] font-sans tabular-nums placeholder:text-gray-400"
                    />
                    {bankFormErrors.accountNumber && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">{bankFormErrors.accountNumber}</p>
                    )}
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-[#89939D] text-xs font-semibold mb-1.5">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: NAMA LENGKAP ANDA"
                      value={newAccountHolderName}
                      onChange={(e) => {
                        setNewAccountHolderName(e.target.value);
                        if (bankFormErrors.holderName) {
                          setBankFormErrors(prev => ({ ...prev, holderName: undefined }));
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[#45545C] text-sm outline-none focus:border-[#08B9ED] uppercase placeholder:text-gray-400"
                    />
                    {bankFormErrors.holderName && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">{bankFormErrors.holderName}</p>
                    )}
                    <p className="mt-1 text-[11px] text-[#89939D]">
                      Pastikan nama sesuai dengan yang terdaftar di buku tabungan/akun e-wallet Anda.
                    </p>
                  </div>

                  {/* Primary Toggle */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPrimaryAccount}
                        onChange={(e) => setIsPrimaryAccount(e.target.checked)}
                        className="w-4 h-4 text-[#08B9ED] rounded border-gray-300 focus:ring-[#08B9ED] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-[#45545C]">
                        Jadikan Rekening Utama untuk Penarikan
                      </span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      fullWidth 
                      isLoading={isSubmittingBank}
                      disabled={isSubmittingBank}
                    >
                      Simpan Rekening Penarikan
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Daftar Rekening Tersimpan (Right side) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[#45545C] font-bold text-base flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-[#08B9ED]" />
                    <span>Daftar Rekening Tersimpan</span>
                  </h3>
                  <span className="text-xs text-[#89939D] font-medium">
                    {savedBankAccounts ? savedBankAccounts.length : 0} Rekening
                  </span>
                </div>

                <div className="p-5">
                  {(!savedBankAccounts || savedBankAccounts.length === 0) ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[#89939D]">
                        <BuildingLibraryIcon className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#45545C]">Belum Ada Rekening Tersimpan</h4>
                      <p className="text-xs text-[#89939D] mt-1 max-w-sm mx-auto leading-relaxed">
                        Anda belum menambahkan rekening bank untuk penarikan dana. Silakan isi form di samping untuk menyimpan rekening Anda.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {savedBankAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`p-4 rounded-xl border transition-all ${
                            account.isPrimary
                              ? 'border-[#08B9ED] bg-[#08B9ED]/5 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-[#08B9ED] shrink-0 shadow-2xs">
                                <BuildingLibraryIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-[#45545C]">
                                    {account.bankName}
                                  </h4>
                                  {account.isPrimary && (
                                    <span className="inline-flex items-center gap-1 bg-[#08B9ED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <StarSolidIcon className="w-3 h-3" />
                                      Utama
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-sm font-semibold text-[#1F2937] tracking-wider mt-1">
                                  {account.accountNumber}
                                </p>
                                <p className="text-xs text-[#89939D] uppercase tracking-wide mt-0.5">
                                  a.n {account.accountHolderName}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {!account.isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimary(account.id)}
                                  className="text-xs font-semibold text-[#08B9ED] hover:bg-[#08B9ED]/10 px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                  title="Jadikan rekening ini sebagai pilihan utama saat withdrawal"
                                >
                                  <StarIcon className="w-3.5 h-3.5" />
                                  <span>Jadikan Utama</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveAccount(account.id, account.bankName)}
                                className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Hapus rekening"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Link to Withdrawal Page */}
                      <div className="pt-3 border-t border-gray-100 flex justify-end">
                        <Link
                          to="/wallet/withdrawal"
                          className="text-xs font-bold text-[#08B9ED] hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>Buka Menu Penarikan (Withdrawal)</span>
                          <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingPage;