import React from 'react';
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  headerActions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, headerActions }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(true)}
          actions={headerActions}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};