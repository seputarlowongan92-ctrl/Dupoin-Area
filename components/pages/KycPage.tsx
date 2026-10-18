import React from 'react';
import Button from '../common/Button';
import { IdentificationIcon } from '@heroicons/react/24/outline';

const KycPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#45545C] mb-6 tracking-tight">Verifikasi KYC</h2>
      <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-xl shadow-sm max-w-2xl">
        <div className="inline-flex p-3 bg-cyan-50 rounded-xl mb-4 border border-[#08B9ED]/20">
          <IdentificationIcon className="w-8 h-8 text-[#08B9ED]" />
        </div>
        <h3 className="text-lg font-bold text-[#45545C] mb-2">Identifikasi Pengguna Resmi</h3>
        <p className="text-[#89939D] text-sm mb-4 leading-relaxed">
          Untuk mematuhi regulasi BAPPEBTI & OJK serta meningkatkan keamanan transaksi Anda, lengkapi verifikasi identitas (KTP/SIM/Paspor).
        </p>
        <p className="text-[#89939D] text-xs mb-6 bg-slate-50 p-3 rounded-lg border border-gray-100">
          Dokumen yang diperlukan: Foto KTP Asli, Swafoto (Selfie) dengan KTP, dan Nomor NPWP (opsional).
        </p>
        <Button variant="primary">
          Mulai Verifikasi KYC
        </Button>
      </div>
    </div>
  );
};

export default KycPage;
