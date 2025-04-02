import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  })
}));

// Mock Link component
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
      <a href={href} className={className} data-testid={`link-to-${href}`}>
        {children}
      </a>
    ),
  };
});

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

describe('Header', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    documentElementMock.classList.add.mockClear();
    documentElementMock.classList.remove.mockClear();
    localStorageMock.clear();
  });

  // Helper function to render with AuthProvider
  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthProvider>
        {ui}
      </AuthProvider>
    );
  };

  it('renders navigation links', () => {
    renderWithAuth(<Header />);
    
    // Use getAllByTestId to handle multiple elements with the same testId
    const homeLinks = screen.getAllByTestId('link-to-/');
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(screen.getByTestId('link-to-/favorites')).toBeInTheDocument();
    expect(screen.getByText('Movie Explorer')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('toggles dark mode when the button is clicked', () => {
    renderWithAuth(<Header />);
    
    // Initially, dark mode should be off (from our mock)
    expect(documentElementMock.classList.add).not.toHaveBeenCalledWith('dark');
    
    // Find and click the dark mode toggle button using data-testid, get the first one
    const darkModeButtons = screen.getAllByTestId('theme-toggle');
    const darkModeButton = darkModeButtons[0];
    fireEvent.click(darkModeButton);
    
    // Dark mode should be on after click
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
    expect(localStorageMock.getItem('darkMode')).toBe('true');
    
    // Click again to turn off dark mode
    fireEvent.click(darkModeButton);
    
    // Dark mode should be off after second click
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
    expect(localStorageMock.getItem('darkMode')).toBe('false');
  });

  it('initializes dark mode from localStorage', () => {
    // Set dark mode preference in localStorage
    localStorageMock.setItem('darkMode', 'true');
    
    renderWithAuth(<Header />);
    
    // Dark mode should be enabled
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });
}); 