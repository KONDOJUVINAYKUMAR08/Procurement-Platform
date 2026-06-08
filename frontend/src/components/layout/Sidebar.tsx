import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShoppingCart,
  FileCheck,
  Receipt,
  FolderOpen,
  Bell,
  Shield,
  BarChart3,
  Users,
  Settings,
  X,
  Hexagon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NavItem: React.FC<{ item: NavItem; onClose: () => void }> = ({ item, onClose }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group
        ${isActive
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
        }`}
    >
      <span className={`${isActive ? 'text-black' : 'text-neutral-500 group-hover:text-white'} transition-colors`}>
        {item.icon}
      </span>
      {item.label}
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Vendors', path: '/vendors', icon: <Building2 size={18} /> },
    { label: 'Purchase Requests', path: '/purchase-requests', icon: <FileText size={18} /> },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={18} /> },
    { label: 'Contracts', path: '/contracts', icon: <FileCheck size={18} /> },
    { label: 'Invoices', path: '/invoices', icon: <Receipt size={18} /> },
    { label: 'Documents', path: '/documents', icon: <FolderOpen size={18} /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
    { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} /> },
    { label: 'Audit Logs', path: '/audit-logs', icon: <Shield size={18} />, roles: ['admin'] },
    { label: 'Users', path: '/users', icon: <Users size={18} />, roles: ['admin'] },
    { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-white/[0.06] z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Hexagon size={24} className="text-white" />
            <span className="text-lg font-bold tracking-tight">ProcureFlow</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filteredItems.map((item) => (
            <NavItem key={item.path} item={item} onClose={onClose} />
          ))}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-card border-r border-white/[0.06]">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-white/[0.06]">
          <Hexagon size={24} className="text-white" />
          <span className="text-lg font-bold tracking-tight">ProcureFlow</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavItem key={item.path} item={item} onClose={() => {}} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
