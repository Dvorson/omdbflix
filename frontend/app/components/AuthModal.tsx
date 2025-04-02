'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onLogin and onRegister props are no longer needed as we use the context
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, isLoading: authLoading } = useAuth(); // Get functions from context
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Removed local loading state, use authLoading from context
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  // Handle visibility with animation timing
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Reset fields and error when opening
      setError(null);
      setName('');
      setEmail('');
      setPassword('');
      setMode('login'); // Default to login mode
      // Focus the first input when modal opens
      setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);
    } else {
      // Delay hiding to allow for animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // setLoading(true); // Context now handles loading state

    try {
      if (mode === 'login') {
        await login({ email, password }); // Use login from context
      } else {
        if (!name.trim()) {
          setError('Name is required'); // Set error directly
          return; // Stop submission
        }
        await register({ name, email, password }); // Use register from context
      }
      
      // Reset form state not needed here as useEffect on isOpen handles it
      onClose(); // Close modal on success
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      // Try to get error message from backend response, fallback to general message
      const backendMessage = error.response?.data?.message;
      setError(backendMessage || error.message || 'An error occurred');
    } 
    // finally {
    //   setLoading(false); // Context handles loading state
    // }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    // Optionally reset fields when toggling
    // setName('');
    // setEmail('');
    // setPassword('');
  };

  if (!isOpen && !visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 200ms ease-in-out' }}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/50 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 200ms ease-in-out' }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transition: 'transform 200ms ease-out, opacity 200ms ease-out' }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" id="modal-title">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Your name"
                  required={mode === 'register'} // Only required in register mode
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                ref={initialFocusRef} // Keep focus ref on email
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            
            <div className="mt-6 flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={toggleMode}
                disabled={authLoading} // Disable toggle if auth is processing
              >
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
              
              <button
                type="submit"
                disabled={authLoading} // Use authLoading from context
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {authLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 