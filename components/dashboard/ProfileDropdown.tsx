import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cog6ToothIcon, PowerIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserIcon as SolidUserIcon } from '@heroicons/react/24/solid';

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!user) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[295px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[70] animate-fade-in overflow-hidden"
    >
      {/* 1. Profile Header with Avatar & Details matching user reference */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center space-x-3.5">
          {/* Circular Photo */}
          <div className="relative shrink-0">
            {user.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt="Profile" 
                className="h-[68px] w-[68px] rounded-full object-cover border border-gray-100 shadow-xs" 
              />
            ) : (
              <UserCircleIcon className="h-[68px] w-[68px] text-[#89939D]" />
            )}
          </div>

          {/* User info & View Profile pill button */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-normal text-[#374151] truncate leading-tight">
              ({user.username})
            </p>
            <p className="text-[11px] font-semibold text-[#8C98A4] uppercase tracking-wider truncate mt-0.5">
              {user.fullName}
            </p>
            <div className="mt-2.5">
              <Link to="/setting" onClick={handleLinkClick}>
                <button className="bg-[#FA8460] hover:bg-[#EE704B] active:scale-95 text-white font-medium px-4 py-1.5 rounded-full transition-all text-xs shadow-xs cursor-pointer inline-flex items-center justify-center">
                  View Profile
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Menu Links */}
      <div className="py-2 bg-white">
        <Link
          to="/setting"
          onClick={handleLinkClick}
          className="flex items-center px-5 py-2.5 text-sm text-[#45545C] hover:bg-slate-50 transition-colors group"
        >
          <Cog6ToothIcon className="h-5 w-5 mr-3.5 text-[#5A6A7E] stroke-[1.8] group-hover:text-[#FA8460] transition-colors" />
          <span className="font-medium text-[#45545C]">My Profile</span>
        </Link>
        <Link
          to="/setting"
          onClick={handleLinkClick}
          className="flex items-center px-5 py-2.5 text-sm text-[#45545C] hover:bg-slate-50 transition-colors group"
        >
          <SolidUserIcon className="h-5 w-5 mr-3.5 text-[#5A6A7E] group-hover:text-[#FA8460] transition-colors" />
          <span className="font-medium text-[#45545C]">Profile Image</span>
        </Link>
      </div>

      {/* 3. Logout Section */}
      <div className="pb-2 bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-5 py-2.5 text-sm text-[#45545C] hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <PowerIcon className="h-5 w-5 mr-3.5 text-[#5A6A7E] stroke-[2] group-hover:text-[#FA8460] transition-colors" />
          <span className="font-medium text-[#45545C]">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;