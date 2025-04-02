import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../app/contexts/AuthContext';
import { act } from 'react';

// Mock the API service module
jest.mock('../app/services/api', () => {
  // Start with actual implementations from the original module
  const actualModule = jest.requireActual('../app/services/api');
  
  // Create mock functions
  const setToken = jest.fn(actualModule.setToken);
  
  const loginUser = jest.fn(async (credentials) => {
    if (credentials.email === 'bad@example.com') {
      // For the bad login test
      setToken(null);
      throw new Error('Invalid credentials');
    }
    // For the successful login test
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const response = { token: 'test-token', user: mockUser };
    setToken(response.token);
    return response;
  });
  
  const registerUser = jest.fn(async (userData) => {
    // For the successful registration test
    const mockUser = { id: 2, name: userData.name, email: userData.email };
    const response = { token: 'new-test-token-456', user: mockUser };
    setToken(response.token);
    return response;
  });
  
  const logoutUser = jest.fn(async () => {
    // For the logout test
    setToken(null);
    return { message: 'Logged out successfully' };
  });
  
  // Return the mock module
  return {
    ...actualModule,
    loginUser,
    registerUser,
    logoutUser,
    setToken,
    checkAuthStatus: jest.fn(),
  };
});

// Import the mock functions for assertions
import { 
    loginUser as apiLoginUser,
    registerUser as apiRegisterUser,
    checkAuthStatus as apiCheckAuthStatus,
    logoutUser as apiLogoutUser,
    setToken as apiSetToken
} from '../app/services/api';

// Cast to mocked functions
const mockedApiLoginUser = apiLoginUser as jest.MockedFunction<typeof apiLoginUser>;
const mockedApiRegisterUser = apiRegisterUser as jest.MockedFunction<typeof apiRegisterUser>;
const mockedApiCheckAuthStatus = apiCheckAuthStatus as jest.MockedFunction<typeof apiCheckAuthStatus>;
const mockedApiLogoutUser = apiLogoutUser as jest.MockedFunction<typeof apiLogoutUser>;
const mockedApiSetToken = apiSetToken as jest.MockedFunction<typeof apiSetToken>;

// Mock User Data for tests
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
};

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isLoading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
      <button onClick={() => login({ email: 'test@example.com', password: 'password123' })} data-testid="login-button">
        Login
      </button>
      <button onClick={() => register({ name:'Reg User', email: 'reg@example.com', password: 'password123' })} data-testid="register-button">
        Register
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button
        onClick={async () => {
          try {
            await login({ email: 'bad@example.com', password: 'wrongpassword' });
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

describe('AuthContext', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  it('should provide initial loading then unauthenticated state', async () => {
    // Mock checkAuthStatus to return unauthenticated
    mockedApiCheckAuthStatus.mockResolvedValue({ isAuthenticated: false, user: null });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state should be loading
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading');

    // Wait for the initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    expect(mockedApiCheckAuthStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
  });
  
  it('should authenticate user on successful login', async () => {
    // Mock API responses for this specific test
    const mockToken = 'test-token';
    mockedApiCheckAuthStatus.mockResolvedValueOnce({ isAuthenticated: false, user: null });
    mockedApiLoginUser.mockResolvedValueOnce({ token: mockToken, user: mockUser });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Perform login
    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      await userEvent.click(loginButton);
    });
    
    // Verify authenticated state by focusing on UI indicators
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    
    // Verify the mock was called with right arguments
    expect(mockedApiLoginUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });
  
  it('should handle login failure', async () => {
    // Mock API responses for this specific test
    mockedApiCheckAuthStatus.mockResolvedValueOnce({ isAuthenticated: false, user: null });
    const loginError = new Error('Invalid credentials');
    mockedApiLoginUser.mockRejectedValueOnce(loginError);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Click the bad login button that catches errors
    const badLoginBtn = screen.getByTestId('bad-login-button');
    await act(async () => {
      await userEvent.click(badLoginBtn);
    });
    
    // Verify error message was captured (simple way for test)
    expect(document.body.getAttribute('data-error')).toBe('Invalid credentials');
    // Verify user is still unauthenticated in UI
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('should authenticate user on successful registration', async () => {
    // Mock responses for this specific test
    mockedApiCheckAuthStatus.mockResolvedValueOnce({ isAuthenticated: false, user: null });
    
    // Prepare the new user data
    const newUser = { id: 2, name: 'Reg User', email: 'reg@example.com' };
    const mockToken = 'new-test-token-456';
    mockedApiRegisterUser.mockResolvedValueOnce({ token: mockToken, user: newUser });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated'));

    // Click register button
    await act(async () => {
      await userEvent.click(screen.getByTestId('register-button'));
    });
    
    // Verify UI state changes
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Reg User');
    });
  });

  it('should handle registration failure', async () => {
    // Mock responses for this specific test
    mockedApiCheckAuthStatus.mockResolvedValueOnce({ isAuthenticated: false, user: null });
    const regError = new Error('Email already exists');
    mockedApiRegisterUser.mockRejectedValueOnce(regError);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated'));

    // Attempt registration
    await act(async () => {
      userEvent.click(screen.getByTestId('register-button'));
      await Promise.resolve();
    });

    // Verify state didn't change in UI
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('should logout user', async () => {
    // Mock responses for this specific test
    mockedApiCheckAuthStatus.mockResolvedValueOnce({ isAuthenticated: true, user: mockUser });
    mockedApiLogoutUser.mockResolvedValueOnce({ message: 'Logged out successfully' });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Perform logout
    const logoutButton = screen.getByTestId('logout-button');
    await act(async () => {
      await userEvent.click(logoutButton);
    });
    
    // Check API was called
    expect(mockedApiLogoutUser).toHaveBeenCalledTimes(1);

    // Verify unauthenticated state in UI
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
  });

  it('should restore auth state if token exists on mount', async () => {
    // Mock checkAuthStatus returning authenticated user
    mockedApiCheckAuthStatus.mockResolvedValue({ isAuthenticated: true, user: mockUser });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state is Loading
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading');

    // Check that auth state was restored
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
    expect(mockedApiCheckAuthStatus).toHaveBeenCalledTimes(1);
  });
}); 