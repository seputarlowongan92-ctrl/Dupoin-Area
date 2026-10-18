import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrophyIcon, 
  RocketLaunchIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

interface InvestmentTier {
  investment: string;
  profit: string;
}

interface InvestmentPackage {
  name: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  tiers: InvestmentTier[];
}

const INVESTMENT_PACKAGES: InvestmentPackage[] = [
  {
    name: "PAKET BASIC",
    icon: <BoltIcon className="w-12 h-12" />,
    color: "bg-teal-500",
    textColor: "text-teal-400",
    borderColor: "border-teal-500/30",
    shadowColor: "shadow-teal-500/10",
    tiers: [
      { investment: "500.000", profit: "15.000.000" },
      { investment: "1.000.000", profit: "30.000.000" },
    ]
  },
  {
    name: "PAKET GOLD",
    icon: <TrophyIcon className="w-12 h-12" />,
    color: "bg-primary",
    textColor: "text-primary",
    borderColor: "border-primary/40",
    shadowColor: "shadow-primary/20",
    tiers: [
      { investment: "1.500.000", profit: "45.000.000" },
      { investment: "2.000.000", profit: "70.000.000" },
      { investment: "2.500.000", profit: "90.000.000" },
    ]
  },
  {
    name: "PAKET PLATINUM",
    icon: <RocketLaunchIcon className="w-12 h-12" />,
    color: "bg-gray-300",
    textColor: "text-gray-300",
    borderColor: "border-gray-300/30",
    shadowColor: "shadow-gray-300/10",
    tiers: [
      { investment: "3.500.000", profit: "110.000.000" },
      { investment: "4.500.000", profit: "130.000.000" },
      { investment: "5.000.000", profit: "145.000.000" },
      { investment: "5.500.000", profit: "160.000.000" },
    ]
  },
  {
    name: "PAKET DIAMOND",
    icon: <SparklesIcon className="w-12 h-12" />,
    color: "bg-cyan-400",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-400/30",
    shadowColor: "shadow-cyan-400/10",
    tiers: [
      { investment: "6.000.000", profit: "200.000.000" },
      { investment: "7.000.000", profit: "240.000.000" },
      { investment: "8.000.000", profit: "270.000.000" },
      { investment: "9.000.000", profit: "300.000.000" },
      { investment: "10.000.000", profit: "350.000.000" },
    ]
  }
];

const InvestmentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTier = (amount: string) => {
    // Navigate to the deposit page (add-balance) with the raw numeric amount as query param and state
    const cleanAmount = amount.replace(/\D/g, '');
    navigate(`/wallet/add-balance?amount=${cleanAmount}`, { state: { amount: cleanAmount } });
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-fade-in font-sans">
      
      {/* Header Section */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-3xl font-extrabold text-[#45545C] tracking-tight uppercase">
          DAFTAR PAKET INVESTASI <span className="text-[#08B9ED]">DUPOIN</span>
        </h2>
        <p className="text-[#08B9ED] max-w-2xl mx-auto text-sm sm:text-base font-semibold">
          Paket Aktif Setelah Pembayaran Modal
        </p>
      </div>

      {/* Grid Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INVESTMENT_PACKAGES.map((pkg, idx) => (
          <div 
            key={idx} 
            className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#08B9ED]/40 group flex flex-col`}
          >
            {/* Package Header */}
            <div className={`p-6 flex flex-col items-center space-y-3 bg-[#F8FAFC] border-b border-gray-100`}>
              <div className={`${pkg.textColor} group-hover:scale-105 transition-transform duration-300`}>
                {pkg.icon}
              </div>
              <h3 className={`text-lg font-bold tracking-wider text-[#45545C] text-center`}>
                {pkg.name}
              </h3>
            </div>

            {/* Tiers List */}
            <div className="p-5 flex-grow space-y-3.5">
              {pkg.tiers.map((tier, tIdx) => (
                <button 
                  key={tIdx} 
                  onClick={() => handleSelectTier(tier.investment)}
                  className="w-full text-left bg-[#F8FAFC] border border-gray-200 rounded-xl p-3.5 space-y-2 group/item hover:bg-white hover:border-[#08B9ED] transition-all cursor-pointer focus:outline-none block shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[#89939D] text-[10px] uppercase font-bold tracking-wider">Modal</span>
                    <span className="text-[#45545C] font-sans font-bold text-sm">Rp {tier.investment}</span>
                  </div>
                  <div className="h-[1px] bg-gray-200 w-full"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#89939D] text-[10px] uppercase font-bold tracking-wider">Hasil</span>
                    <span className="text-[#00C99A] font-sans font-bold text-base">Rp {tier.profit}</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="w-full inline-flex items-center justify-center text-[10px] font-bold py-1.5 rounded-lg border border-gray-200 text-[#45545C] group-hover/item:bg-[#08B9ED] group-hover/item:text-white group-hover/item:border-[#08B9ED] transition-all uppercase tracking-wider">
                      Pilih Nominal Ini
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="p-5 pt-0 mt-auto">
              <button 
                onClick={() => handleSelectTier(pkg.tiers[0].investment)}
                className={`w-full bg-[#08B9ED] hover:bg-[#07A6D5] text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center`}
              >
                <CurrencyDollarIcon className="w-4 h-4 mr-1.5" />
                Mulai Rp {pkg.tiers[0].investment}
              </button>
              <div className="mt-3 flex items-center justify-center space-x-1.5">
                <CheckCircleIcon className="w-4 h-4 text-[#00C99A]" />
                <span className="text-[11px] text-[#89939D] font-medium">Bagi Hasil Otomatis</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-cyan-50 rounded-xl border border-[#08B9ED]/20">
            <ShieldCheckIcon className="w-8 h-8 text-[#08B9ED]" />
          </div>
          <div>
            <h4 className="text-[#45545C] font-bold text-lg">Keamanan Dana Terjamin</h4>
            <p className="text-[#89939D] text-sm max-w-md mt-1">
              Sistem kami menggunakan enkripsi end-to-end dan pemisahan akun untuk memastikan modal Anda aman selama masa kontrak investasi.
            </p>
          </div>
        </div>
        <button className="bg-white border-2 border-[#08B9ED] text-[#08B9ED] hover:bg-[#08B9ED] hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all">
          Hubungi Konsultan
        </button>
      </div>

      <div className="text-center pt-8 pb-4 space-y-2">
          <p className="text-gray-400 text-xs font-medium">
              DUPOIN telah resmi dan terdaftar dan diawasi oleh OJK, BAPPEBTI serta peserta penjamin LPS
          </p>
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.4em] font-black">
              Official Investment Program &copy; 2026 DUPOIN
          </p>
      </div>

    </div>
  );
};

export default InvestmentPage;