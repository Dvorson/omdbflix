'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  return (
    <header className="bg-white shadow dark:bg-gray-800">
      <div className="container mx-auto flex flex-col items-center justify-between px-4 py-4 sm:flex-row">
        <div className="mb-4 flex w-full items-center justify-between sm:mb-0 sm:w-auto">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            Movie Explorer
          </Link>
          
          <div className="flex items-center sm:hidden">
            <ThemeToggle />
            
            {isLoading ? (
                <div className="ml-4 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" role="status"></div>
            ) : isAuthenticated ? (
              <Link
                href="/favorites"
                className="ml-4 text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                aria-label="View favorites"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="ml-4 text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                aria-label="Sign in or register"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <nav className="hidden items-center space-x-6 sm:flex">
          <Link href="/" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
            Home
          </Link>
          
          {isAuthenticated && (
            <Link href="/favorites" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
              Favorites
            </Link>
          )}
          
          <ThemeToggle />
          
          <div className="flex items-center space-x-4">
             {isLoading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" role="status"></div>
             ) : isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300" title={user?.email}>
                  Hi, {user?.name}
                </span>
                <button
                  onClick={logout}
                  disabled={isLoading}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                data-testid="sign-in-button"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </header>
  );
};

export default Header; 