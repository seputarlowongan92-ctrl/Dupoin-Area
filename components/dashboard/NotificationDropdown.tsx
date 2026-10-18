import React, { useRef, useEffect } from 'react';
import { NotificationItem } from '../../types';
import { useTransactions } from '../../context/TransactionContext';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { markNotificationAsRead } = useTransactions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[450px] overflow-hidden flex flex-col animate-fade-in"
    >
      <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
        <h3 className="text-sm font-bold text-[#45545C]">Notifikasi</h3>
        <span className="text-[10px] bg-[#08B9ED]/15 text-[#08B9ED] px-2 py-0.5 rounded-full font-bold">Terbaru</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#89939D] text-sm">Tidak ada notifikasi baru.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-4 cursor-pointer transition-colors ${
                  notif.read ? 'opacity-60 bg-gray-50/50' : 'hover:bg-slate-50'
                }`}
                onClick={() => handleNotificationClick(notif.id)}
              >
                <p className={`text-sm leading-relaxed ${notif.read ? 'text-[#89939D]' : 'text-[#45545C] font-medium'}`}>
                  {notif.message}
                </p>
                <p className="text-[10px] text-[#89939D] mt-2 font-mono tabular-nums">
                  {new Date(notif.date).toLocaleString('id-ID')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;