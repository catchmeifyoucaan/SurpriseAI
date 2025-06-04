
import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_NAME, SIDEBAR_ITEMS, AdminPanelIcon } from '../constants';
import { NavItem } from '../types';
import { useAuth } from '../context/AuthContext'; // Import useAuth

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const auth = useAuth(); // Get auth context

  const currentSidebarItems: NavItem[] = [...SIDEBAR_ITEMS];
  if (auth.isAuthenticated && auth.user?.role === 'admin') {
    currentSidebarItems.push({
      name: 'User Management',
      path: '/admin/users',
      icon: <AdminPanelIcon />,
    });
  }

  const renderNavLinks = (items: NavItem[], isMobile: boolean) => items.map((item: NavItem) => (
    <NavLink
      key={item.name}
      to={item.path}
      onClick={() => isMobile && setSidebarOpen(false)}
      className={({ isActive }) =>
        `group flex items-center px-2 ${isMobile ? 'py-2 text-sm' : 'py-3 text-sm'} font-medium rounded-md transition-colors duration-150 ${
          isActive
            ? 'bg-accent text-primary shadow-lg'
            : 'text-text-secondary hover:bg-slate-700 hover:text-text-primary'
        }`
      }
    >
      {React.cloneElement(item.icon, { className: 'mr-3 flex-shrink-0 h-5 w-5' })}
      {item.name}
    </NavLink>
  ));

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transform transition-transform ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-secondary pt-5 pb-4">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <div className="h-8 w-8 bg-accent rounded-full animate-pulse-fast"></div>
            <span className="ml-3 text-xl font-semibold text-text-primary">{APP_NAME}</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {renderNavLinks(currentSidebarItems, true)}
          </nav>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary border-b border-slate-700">
              <div className="h-8 w-8 bg-accent rounded-full animate-pulse-fast"></div>
              <span className="ml-3 text-xl font-semibold text-text-primary">{APP_NAME}</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 bg-secondary overflow-y-auto">
              {renderNavLinks(currentSidebarItems, false)}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;