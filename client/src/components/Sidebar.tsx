import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  HomeIcon, 
  BookOpenIcon, 
  BarChart3Icon, 
  DollarSignIcon, 
  UsersIcon, 
  SettingsIcon, 
  HelpCircleIcon,
  ShieldIcon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [location] = useLocation();

  const isActiveRoute = (route: string) => {
    // Handle exact matches and also handle nested routes (e.g., /budget/item should highlight /budget)
    return location === route || (route !== '/' && location.startsWith(route));
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Constitution', href: '/constitution', icon: BookOpenIcon },
    { name: 'Current Votes', href: '/votes', icon: BarChart3Icon },
    { name: 'Budget', href: '/budget', icon: DollarSignIcon },
    { name: 'DReps', href: '/dreps', icon: UsersIcon },
  ];

  const footerItems = [
    { name: 'Admin', href: '/admin', icon: ShieldIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
    { name: 'Help & FAQ', href: '/help', icon: HelpCircleIcon },
  ];

  const navLinkClasses = (isActive: boolean) => `
    flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-all
    ${isActive 
      ? 'text-white bg-cardano-blue shadow-md' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
  `;

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} md:flex md:flex-shrink-0`}>
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-cardano-blue">
          <svg className="h-8 w-auto text-white" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12Z" fill="white"/>
            <path d="M12 4L8 8L12 12L16 8L12 4Z" fill="#4570EA"/>
            <path d="M12 12L8 16L12 20L16 16L12 12Z" fill="#4570EA"/>
            <path d="M6 10L10 14L6 18L2 14L6 10Z" fill="#4570EA"/>
            <path d="M18 10L22 14L18 18L14 14L18 10Z" fill="#4570EA"/>
            <path d="M32 6.5H36.5C40 6.5 42 8.5 42 11.25C42 14 40 16 36.5 16H32V6.5ZM36.5 14C38.5 14 39.5 13 39.5 11.25C39.5 9.5 38.5 8.5 36.5 8.5H34.5V14H36.5Z" fill="white"/>
            <path d="M44 6.5H51.5V8.5H46.5V10.5H50.5V12.5H46.5V14H51.5V16H44V6.5Z" fill="white"/>
            <path d="M53 6.5H55.5V13.6L60.5 6.5H63V16H60.5V8.9L55.5 16H53V6.5Z" fill="white"/>
            <path d="M68 6.5H70.5V14H75V16H68V6.5Z" fill="white"/>
            <path d="M77 6.5H84.5V8.5H79.5V10.5H83.5V12.5H79.5V14H84.5V16H77V6.5Z" fill="white"/>
            <path d="M89 12.5L85 6.5H88L90.5 10.5L93 6.5H96L92 12.5V16H89V12.5Z" fill="white"/>
          </svg>
        </div>
        
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1 bg-white">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className={navLinkClasses(isActiveRoute(item.href))}
              >
                <item.icon className={`mr-3 h-6 w-6 ${isActiveRoute(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="mt-auto mb-4 px-4">
            <div className="space-y-1">
              {footerItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={navLinkClasses(isActiveRoute(item.href))}
                >
                  <item.icon className={`mr-3 h-6 w-6 ${isActiveRoute(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
