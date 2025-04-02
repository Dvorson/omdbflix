// Extend the Express Request interface to include the user object populated by Passport
declare namespace Express {
  export interface User {
    id: number; // Assuming ID is a number
    email: string;
    name: string;
    // Add other properties attached by your Passport strategies if needed
    // e.g., googleId?: string;
    // e.g., githubId?: string;
  }
} 