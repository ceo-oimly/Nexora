import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllDeposits, getAllWithdrawals } from '../../services/ledgerService';
import {
  TrendingUp,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Settings,
  ShieldAlert,
  Headphones,
  LogOut,
  Menu,
  X,
  User,
  Bell,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Compute pending requests for admin badge
  const pendingDepositsCount = isAdmin ? getAllDeposits().filter((d) => d.status === 'PENDING').length : 0;
  const pendingWithdrawalsCount = isAdmin ? getAllWithdrawals().filter((w) => w.status === 'PENDING').length : 0;
  const totalPendingAdminRequests = pendingDepositsCount + pendingWithdrawalsCount;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  if (isAdmin) {
    navLinks.push({
      id: 'admin',
      label: 'Admin Terminal',
      icon: ShieldAlert,
    });
  }

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg font-mono-numbers">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  NEXORA
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const showBadge = item.id === 'admin' && totalPendingAdminRequests > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                      {totalPendingAdminRequests}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Authenticated User Pill OR Sign In / Register Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border border-blue-300 text-blue-700 font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-slate-800 leading-tight">{user.fullName || user.email}</div>
                  <div className="text-[10px] text-blue-600 font-mono-numbers font-semibold">
                    {user.role === 'ADMIN' ? 'EXCHANGE ADMIN' : 'VERIFIED ACCOUNT'}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-slate-800">{user.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-blue-700 font-semibold flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-blue-600" />
                        <span>Admin Terminal</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                        onNavigate('landing');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const showBadge = item.id === 'admin' && totalPendingAdminRequests > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {showBadge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {totalPendingAdminRequests}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!user && (
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('login');
                }}
                className="flex-1 py-2 text-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('signup');
                }}
                className="flex-1 py-2 text-center rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
