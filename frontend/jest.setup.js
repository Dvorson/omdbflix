// Import jest-dom
import '@testing-library/jest-dom'; 

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.entries = [];
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    this.unobserve = jest.fn();
  }

  // Used for testing purposes to trigger the callback
  simulateIntersection(isIntersecting) {
    this.entries = [{ isIntersecting }];
    this.callback(this.entries, this);
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out errors about act() and other React warnings during tests
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported in React 18') ||
    args[0]?.includes?.('Warning: An update to') ||
    args[0]?.includes?.('Warning: You invoked act()') ||
    args[0]?.includes?.('The current testing environment is not configured to support act')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Next.js router mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
})); 