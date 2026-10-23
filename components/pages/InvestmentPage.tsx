import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrophyIcon, 
  RocketLaunchIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  BoltIcon,
  ArrowDownIcon,
  PhotoIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';

interface InvestmentTier {
  investment: string;
  profit: string;
}

interface InvestmentPackage {
  id: string;
  name: string;
  badgeGradient: string;
  icon: React.ReactNode;
  description: string;
  tiers: InvestmentTier[];
}

const INVESTMENT_PACKAGES: InvestmentPackage[] = [
  {
    id: "basic",
    name: "PAKET BASIC",
    badgeGradient: "from-blue-600 to-sky-500",
    icon: <BoltIcon className="w-5 h-5 text-white" />,
    description: "Pilihan tepat untuk pemula dengan modal terjangkau dan potensi hasil tinggi.",
    tiers: [
      { investment: "300.000", profit: "8.000.000" },
      { investment: "500.000", profit: "15.000.000" },
      { investment: "800.000", profit: "17.000.000" },
      { investment: "1.000.000", profit: "21.000.000" },
    ]
  },
  {
    id: "silver",
    name: "PAKET SILVER",
    badgeGradient: "from-sky-600 to-blue-600",
    icon: <ShieldCheckIcon className="w-5 h-5 text-white" />,
    description: "Tingkat lanjutan untuk trader yang ingin memperbesar skala imbal hasil.",
    tiers: [
      { investment: "1.200.000", profit: "24.000.000" },
      { investment: "1.600.000", profit: "28.000.000" },
      { investment: "2.000.000", profit: "32.000.000" },
      { investment: "2.400.000", profit: "45.000.000" },
    ]
  },
  {
    id: "gold",
    name: "PAKET GOLD",
    badgeGradient: "from-indigo-600 to-blue-700",
    icon: <TrophyIcon className="w-5 h-5 text-white" />,
    description: "Paket populer untuk investor dengan hasil maksimal dan likuiditas cepat.",
    tiers: [
      { investment: "3.000.000", profit: "50.000.000" },
      { investment: "3.500.000", profit: "70.000.000" },
      { investment: "4.000.000", profit: "90.000.000" },
      { investment: "5.000.000", profit: "120.000.000" },
    ]
  },
  {
    id: "platinum",
    name: "PAKET PLATINUM",
    badgeGradient: "from-blue-700 to-indigo-800",
    icon: <RocketLaunchIcon className="w-5 h-5 text-white" />,
    description: "Portofolio premium untuk pertumbuhan kapital tinggi dan alokasi optimal.",
    tiers: [
      { investment: "6.000.000", profit: "160.000.000" },
      { investment: "7.000.000", profit: "200.000.000" },
      { investment: "8.000.000", profit: "240.000.000" },
      { investment: "9.000.000", profit: "280.000.000" },
    ]
  }
];

const SIGNATURE_PACKAGE: InvestmentPackage = {
  id: "signature",
  name: "PAKET SIGNATURE",
  badgeGradient: "from-blue-700 via-indigo-600 to-teal-500",
  icon: <SparklesIcon className="w-6 h-6 text-amber-300" />,
  description: "Paket eksklusif kelas atas dengan imbal hasil terbesar dan pendampingan akun prioritas penuh.",
  tiers: [
    { investment: "15.000.000", profit: "400.000.000" }
  ]
};

const InvestmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [showBrochureModal, setShowBrochureModal] = useState<boolean>(false);

  const handleSelectTier = (amount: string) => {
    const cleanAmount = amount.replace(/\D/g, '');
    navigate(`/wallet/add-balance?amount=${cleanAmount}`, { state: { amount: cleanAmount } });
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Official Hero Banner - Inspired by the uploaded brochure */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0284C7] via-[#08B9ED] to-[#0369A1] text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-cyan-300/30">
        
        {/* Background Decorative Patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-4 right-6 hidden md:grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Text & Call to Action */}
          <div className="max-w-2xl space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
              <span>Investasi Resmi & Terjamin</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Nikmati kemudahan transaksi investasi yang terjamin keamanannya
            </h1>

            <p className="text-cyan-100 text-sm sm:text-base font-medium">
              Di bawah pengawasan resmi <span className="font-bold text-white">OJK, BAPPEBTI & BI</span>. Pilih paket investasi terbaik untuk menggandakan keuntungan trading Anda.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a 
                href="#pilihan-paket"
                className="bg-white text-[#0369A1] hover:bg-cyan-50 font-black text-xs sm:text-sm px-6 py-3 rounded-full uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>PILIHAN PAKET</span>
                <ArrowDownIcon className="w-4 h-4 text-[#0369A1] group-hover:translate-y-0.5 transition-transform" />
              </a>

              <button 
                type="button"
                onClick={() => setShowBrochureModal(true)}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-full transition-all flex items-center gap-2 cursor-pointer"
              >
                <PhotoIcon className="w-4 h-4 text-white" />
                <span>Lihat Brosur Resmi</span>
              </button>
            </div>
          </div>

          {/* Right Brand Card with Official Dupoin Logo */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/60 flex flex-col items-center text-center max-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="/logo-dupoin.png" 
                  alt="Dupoin Markets" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('.png.png')) {
                      target.src = '/logo-dupoin.png.png';
                    }
                  }}
                />
              </div>
              <div className="text-[11px] font-bold text-cyan-600 tracking-widest uppercase">
                DUPOIN MARKETS
              </div>
              <p className="text-[#89939D] text-xs mt-2 leading-relaxed">
                Platform broker tepercaya dengan eksekusi instan dan bagi hasil teratur.
              </p>
              <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-around text-[10px] font-bold text-[#45545C]">
                <span className="bg-slate-100 px-2 py-0.5 rounded">OJK</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">BAPPEBTI</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">BI</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Anchor for Section */}
      <div id="pilihan-paket" className="pt-2 text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#45545C] tracking-tight uppercase">
          Daftar Paket Investasi Resmi
        </h2>
        <p className="text-[#08B9ED] text-sm font-semibold">
          Pilih salah satu nominal paket di bawah ini untuk memulai deposit modal
        </p>
      </div>

      {/* Grid Packages: Basic, Silver, Gold, Platinum (2x2 on desktop, 1 col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {INVESTMENT_PACKAGES.map((pkg) => (
          <div 
            key={pkg.id} 
            className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#08B9ED]/40 transition-all flex flex-col relative group"
          >
            {/* Top Floating Badge Bar matching the image */}
            <div className="pt-6 pb-2 px-6 flex justify-center">
              <div className={`bg-gradient-to-r ${pkg.badgeGradient} text-white font-black text-sm uppercase px-8 py-2.5 rounded-full shadow-md flex items-center gap-2 tracking-wider`}>
                {pkg.icon}
                <span>{pkg.name}</span>
              </div>
            </div>

            <div className="px-6 py-2 text-center">
              <p className="text-xs text-[#89939D]">
                {pkg.description}
              </p>
            </div>

            {/* Tiers List */}
            <div className="p-6 pt-3 space-y-3 flex-grow">
              {pkg.tiers.map((tier, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => handleSelectTier(tier.investment)}
                  className="w-full text-left bg-[#F8FAFC] hover:bg-cyan-50/50 border border-gray-200 hover:border-[#08B9ED] rounded-2xl p-4 transition-all duration-200 group/tier cursor-pointer focus:outline-none shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Modal */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#89939D] font-bold uppercase tracking-wider">Modal:</span>
                      <span className="text-base font-extrabold text-[#45545C] font-sans tabular-nums">
                        Rp {tier.investment}
                      </span>
                    </div>

                    {/* Hasil */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#08B9ED] font-bold uppercase tracking-wider">Hasil:</span>
                      <span className="text-lg font-black text-[#00C99A] font-sans tabular-nums">
                        Rp {tier.profit}
                      </span>
                    </div>

                  </div>

                  {/* Micro action bar */}
                  <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-[#89939D] font-medium">Bagi Hasil Otomatis</span>
                    <span className="font-bold text-[#08B9ED] group-hover/tier:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>Pilih Paket Ini</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Card Footer Quick Button */}
            <div className="px-6 pb-6 pt-0 mt-auto">
              <button 
                type="button"
                onClick={() => handleSelectTier(pkg.tiers[0].investment)}
                className={`w-full bg-gradient-to-r ${pkg.badgeGradient} hover:opacity-95 text-white font-bold py-3 rounded-2xl uppercase tracking-wider text-xs shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer`}
              >
                <span>Mulai dari Modal Rp {pkg.tiers[0].investment}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= SPECIAL FULL-WIDTH CARD: PAKET SIGNATURE ================= */}
      <div className="bg-white border-2 border-amber-300/80 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all relative">
        <div className="bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-blue-500/10 p-6 sm:p-8">
          
          {/* Header Badge */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-6">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 text-white font-black text-base uppercase px-10 py-3 rounded-full shadow-lg flex items-center gap-2.5 tracking-widest ring-4 ring-amber-300/40">
              <SparklesIcon className="w-6 h-6 text-amber-300" />
              <span>{SIGNATURE_PACKAGE.name}</span>
            </div>
            <p className="text-center text-xs sm:text-sm text-[#45545C] font-medium max-w-xl">
              {SIGNATURE_PACKAGE.description}
            </p>
          </div>

          {/* Signature Tier Banner */}
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => handleSelectTier(SIGNATURE_PACKAGE.tiers[0].investment)}
              className="w-full bg-white border-2 border-cyan-400 hover:border-cyan-600 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all group cursor-pointer text-center space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                
                {/* Modal */}
                <div className="text-center sm:text-right">
                  <div className="text-xs uppercase font-extrabold text-[#89939D] tracking-wider mb-1">
                    Modal Investasi
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#45545C] font-sans tabular-nums">
                    Rp {SIGNATURE_PACKAGE.tiers[0].investment}
                  </div>
                </div>

                <div className="hidden sm:block text-2xl text-gray-300 font-light">➔</div>

                {/* Hasil */}
                <div className="text-center sm:text-left">
                  <div className="text-xs uppercase font-extrabold text-[#00C99A] tracking-wider mb-1">
                    Hasil Pengembalian
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#00C99A] font-sans tabular-nums">
                    Rp {SIGNATURE_PACKAGE.tiers[0].profit}
                  </div>
                </div>

              </div>

              {/* VIP Benefits */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#45545C]">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  <span>Prioritas Penarikan Tercepat</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  <span>Dedicated Senior Account Manager</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  <span>Garansi Pengembalian Sesuai Akad</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-extrabold text-sm px-8 py-3.5 rounded-full uppercase tracking-wider shadow-md group-hover:scale-105 transition-transform">
                  <span>Pilih Paket Signature Rp {SIGNATURE_PACKAGE.tiers[0].investment}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Security & Regulatory Guarantees */}
      <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-cyan-50 rounded-2xl border border-[#08B9ED]/20 shrink-0">
            <ShieldCheckIcon className="w-8 h-8 text-[#08B9ED]" />
          </div>
          <div>
            <h4 className="text-[#45545C] font-bold text-lg">Keamanan Dana & Pengawasan Resmi</h4>
            <p className="text-[#89939D] text-sm max-w-xl mt-1 leading-relaxed">
              Seluruh transaksi investasi dan bagi hasil diawasi serta dijamin kepatuhannya oleh regulator keuangan. Dana ditempatkan pada rekening terpisah (segregated account) yang diaudit berkala.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowBrochureModal(true)}
          className="bg-white border-2 border-[#08B9ED] text-[#08B9ED] hover:bg-[#08B9ED] hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs"
        >
          Lihat Dokumen Brosur
        </button>
      </div>

      {/* Legal Footer */}
      <div className="text-center pt-4 space-y-2">
        <p className="text-[#89939D] text-xs font-medium max-w-2xl mx-auto">
          DUPOIN telah resmi terdaftar dan diawasi oleh OJK (Otoritas Jasa Keuangan), BAPPEBTI (Badan Pengawas Perdagangan Berjangka Komoditi) & Bank Indonesia.
        </p>
        <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-black">
          Official Investment Program &copy; 2026 DUPOIN Markets Indonesia
        </p>
      </div>

      {/* Modal Popup: View Original Brochure Photo */}
      {showBrochureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-gray-200 relative flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#38485B] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-cyan-400" />
                <span>Brosur Resmi Paket Investasi Dupoin Markets</span>
              </h3>
              <button 
                onClick={() => setShowBrochureModal(false)}
                className="text-gray-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-50">
              <img 
                src="/assets/aistudio/photo_2026-10-23_06-33-49_c6925917.jpg" 
                alt="Brosur Paket Investasi Dupoin" 
                className="w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-gray-200"
              />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setShowBrochureModal(false)}
                className="px-5 py-2 bg-[#08B9ED] hover:bg-[#07A6D5] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvestmentPage;