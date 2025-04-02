import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AuthProvider, useAuth } from '../app/contexts/AuthContext';
import { act } from 'react';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, updateFavorites } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
      {user && <div data-testid="favorites-list">{user?.favorites?.join(',') || ''}</div>}
      <button onClick={() => login('test@example.com', 'password123')} data-testid="login-button">
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button
        onClick={() => {
          if (user) {
            updateFavorites(['movie1', 'movie2']);
          }
        }}
        data-testid="update-favorites-button"
      >
        Update Favorites
      </button>
      <button
        onClick={async () => {
          try {
            await login('bad@example.com', 'wrongpassword');
          } catch (error) {
            document.body.setAttribute('data-error', (error as Error).message);
          }
        }}
        data-testid="bad-login-button"
      >
        Bad Login
      </button>
    </div>
  );
};

// Direct test component to specifically verify updateFavorites 
const UpdateFavoritesTestComponent = () => {
  const { user, updateFavorites } = useAuth();
  
  useEffect(() => {
    // Update favorites when component mounts
    if (user) {
      updateFavorites(['movie1', 'movie2']);
    }
  }, [user, updateFavorites]);
  
  return (
    <div>
      {user && <div data-testid="user-data">{JSON.stringify(user)}</div>}
      {user && <div data-testid="favorites-list">{user.favorites.join(',')}</div>}
    </div>
  );
};

describe('AuthContext', () => {
  // Mock localStorage for all tests
  let mockLocalStorage: { [key: string]: string } = {};
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLocalStorage = {};
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(key => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn(key => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true,
    });

    // Reset axios default headers
    axios.defaults.headers = { common: {} } as any;
  });
  
  it('should provide initial unauthenticated state', async () => {
    // Mock axios get to simulate no user found
    mockedAxios.get.mockRejectedValueOnce(new Error('No token'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
  });
  
  it('should authenticate user on login', async () => {
    // Mock successful login response
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] };
    const mockToken = 'test-token-123';
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: mockToken, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });
    
    // Click login button
    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });
    
    // Check that auth state was updated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Check that token was stored in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    
    // Check that axios authorization header was set
    expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });
  
  it('should logout user', async () => {
    // Mock initial authenticated state
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] };
    const mockToken = 'test-token-123';
    mockLocalStorage['token'] = mockToken;
    
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete with authenticated state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    await act(async () => {
      userEvent.click(screen.getByTestId('logout-button'));
    });
    
    // Check that auth state was updated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
    
    // Check that token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    
    // Check that axios authorization header was removed
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
  });
  
  it('should restore auth state from localStorage on mount', async () => {
    // Mock localStorage with an existing token
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] };
    const mockToken = 'test-token-123';
    mockLocalStorage['token'] = mockToken;
    
    // Mock successful user fetch response
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Check that auth state was restored from localStorage
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Check that axios authorization header was set
    expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  it('should update favorites list when updateFavorites is called', async () => {
    // Create mockUser with favorites array
    const mockUser = { 
      id: '123', 
      name: 'Test User', 
      email: 'test@example.com', 
      favorites: ['movie1'] 
    };
    
    const mockToken = 'test-token-123';
    mockLocalStorage['token'] = mockToken;
    
    // Mock successful user fetch response
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    // Use the simpler test component
    render(
      <AuthProvider>
        <UpdateFavoritesTestComponent />
      </AuthProvider>
    );
    
    // Wait for the user data to appear
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toBeInTheDocument();
    });
    
    // Check that the favorites list has been updated
    await waitFor(() => {
      expect(screen.getByTestId('favorites-list')).toHaveTextContent('movie1,movie2');
    });
  });

  it('clears user data and token on logout', async () => {
    // Setup
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] };
    const mockToken = 'test-token-123';
    mockLocalStorage['token'] = mockToken;
    
    // Mock successful user fetch response
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth to be initialized
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Call logout
    await act(async () => {
      userEvent.click(screen.getByTestId('logout-button'));
    });
    
    // Verify state after logout
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
    
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('handles authentication failures gracefully', async () => {
    // Mock failed login
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth to be initialized
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });
    
    // Attempt to login with bad credentials
    await act(async () => {
      userEvent.click(screen.getByTestId('bad-login-button'));
    });
    
    // Verify error was displayed
    await waitFor(() => {
      expect(document.body).toHaveAttribute('data-error', 'Invalid credentials');
    });
    
    // Verify user is still unauthenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('properly sets axios authorization header after login', async () => {
    // Setup
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', favorites: [] };
    const mockToken = 'test-token-123';
    
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: mockToken, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for auth to be initialized
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });
    
    // Login
    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });
    
    // Verify header was set
    await waitFor(() => {
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
    });
  });
}); 