import React from 'react';
import Button from '../common/Button';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const SecurityPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C] mb-6 tracking-tight">Pengaturan Keamanan</h2>
      <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-xl shadow-sm max-w-2xl">
        <div className="inline-flex p-3 bg-cyan-50 rounded-xl mb-4 border border-[#08B9ED]/20">
          <ShieldCheckIcon className="w-8 h-8 text-[#08B9ED]" />
        </div>
        <h3 className="text-lg font-bold text-[#45545C] mb-2">Proteksi Akun Anda</h3>
        <p className="text-[#89939D] text-sm mb-6 leading-relaxed">
          Kelola fitur keamanan akun Anda, seperti ubah kata sandi, aktifkan autentikasi dua faktor (2FA), dan tinjau riwayat sesi perangkat yang terhubung.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">
            Ubah Kata Sandi
          </Button>
          <Button variant="secondary">
            Aktifkan 2FA
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;