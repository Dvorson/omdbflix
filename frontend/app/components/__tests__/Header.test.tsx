import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Header from '../Header';
import { AuthContextType, useAuth } from '../../contexts/AuthContext';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// Mock Link component
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
      <a href={href} {...props}>{children}</a>
    ),
  };
});

// Mock AuthModal (we don't need its full implementation for Header test)
jest.mock('../AuthModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="auth-modal">Auth Modal <button onClick={onClose}>Close</button></div> : null,
}));

// Mock ThemeToggle (simpler mock)
jest.mock('../ThemeToggle', () => ({
    __esModule: true,
    default: () => <button data-testid="theme-toggle">Theme</button>,
}));

// Mock useAuth hook
const mockUseAuth = useAuth as jest.Mock;
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  // We don't need the full provider for these tests
  AuthProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: documentElementMock,
  writable: true,
});

// Mock axios for AuthProvider
jest.mock('axios', () => ({
  defaults: {
    headers: {
      common: {}
    }
  },
  get: jest.fn().mockResolvedValue({ data: { success: true, user: { id: '1', name: 'Test', email: 'test@example.com', favorites: [] } } }),
  post: jest.fn().mockResolvedValue({ data: { token: 'fake-token', user: { id: '1', name: 'Test', email: 'test@example.com', favorites: [] } } }),
}));

describe('Header Component', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockRegister = jest.fn();
  const mockCheckStatus = jest.fn();

  const mockUnauthenticatedState: Partial<AuthContextType> = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    register: mockRegister,
    checkStatus: mockCheckStatus,
  };

  const mockAuthenticatedState: Partial<AuthContextType> = {
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    register: mockRegister,
    checkStatus: mockCheckStatus,
  };
  
  const mockLoadingState: Partial<AuthContextType> = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: mockLogin,
      logout: mockLogout,
      register: mockRegister,
      checkStatus: mockCheckStatus,
    };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockUseAuth.mockImplementation(() => mockUnauthenticatedState); // Default to unauthenticated
  });

  it('renders logo and basic links', () => {
    render(<Header />);
    expect(screen.getByText('Movie Explorer')).toBeInTheDocument();
    // Check for link presence via text content
    expect(screen.getByText('Home')).toBeInTheDocument(); 
    // Favorites link shouldn't be visible when logged out initially
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
  });

  it('renders Sign In button when unauthenticated', () => {
    render(<Header />);
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.queryByText(/hi, test user/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('opens AuthModal when Sign In is clicked', async () => {
    render(<Header />);
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    
    const signInButton = screen.getByTestId('sign-in-button');
    await userEvent.click(signInButton);
    
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    
    // Test closing the modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
  });

  it('renders user info and Sign Out button when authenticated', () => {
    mockUseAuth.mockImplementation(() => mockAuthenticatedState);
    render(<Header />);
    
    expect(screen.getByText(/hi, test user/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    // Favorites link should be visible when logged in
    expect(screen.getByText('Favorites')).toBeInTheDocument(); 
  });

  it('calls logout from context when Sign Out is clicked', async () => {
    mockUseAuth.mockImplementation(() => mockAuthenticatedState);
    render(<Header />);
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await userEvent.click(signOutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
  
  it('renders loading indicators when isLoading is true', () => {
      mockUseAuth.mockImplementation(() => mockLoadingState);
      render(<Header />);
      
      // Check for multiple loading spinners (mobile and desktop)
      expect(screen.getAllByRole('status', { hidden: true }).length).toBeGreaterThan(0); 
      // Buttons should be absent or potentially disabled (check based on implementation)
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });
}); 