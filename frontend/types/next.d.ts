import { Metadata } from 'next';
import { ReactNode } from 'react';

declare module 'next' {
  // Override Next.js page props to fix the type errors
  export interface PageProps {
    params: Record<string, string | string[]>;
    searchParams?: Record<string, string | string[] | undefined>;
  }
}

// Make TypeScript recognize the layout and page files
declare module '*.tsx' {
  const Component: (props: { 
    params?: Record<string, string | string[]>;
    searchParams?: Record<string, string | string[] | undefined>;
  }) => ReactNode;
  export default Component;

  export const metadata: Metadata;
  export const generateMetadata: (props: { 
    params: Record<string, string | string[]>;
    searchParams?: Record<string, string | string[] | undefined>;
  }) => Promise<Metadata>;
} 