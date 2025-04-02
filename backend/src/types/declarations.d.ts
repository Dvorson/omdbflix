// Type declarations for modules without proper @types packages

declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(pragma: string, options?: Record<string, unknown>): unknown;
    close(): void;
    [key: string]: unknown;
  }

  interface Statement {
    run(...params: unknown[]): { lastInsertRowid?: number; changes: number };
    get(...params: unknown[]): Record<string, unknown>;
    all(...params: unknown[]): Record<string, unknown>[];
    [key: string]: unknown;
  }

  interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message: string) => void;
    [key: string]: unknown;
  }

  export default Database;
}

// In case the installed @types packages don't work, these declarations would be used as fallbacks
declare module 'bcryptjs' {
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(data: string, salt: string): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
  }
  
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: { expiresIn?: string | number; [key: string]: unknown }
  ): string;
  
  export function verify(
    token: string,
    secretOrPublicKey: string
  ): JwtPayload;
} 