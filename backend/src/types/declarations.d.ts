// Type declarations for modules without proper @types packages

declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(pragma: string, options?: any): any;
    close(): void;
    [key: string]: any;
  }

  interface Statement {
    run(...params: any[]): { lastInsertRowid?: number; changes: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
    [key: string]: any;
  }

  interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message: string) => void;
    [key: string]: any;
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
    [key: string]: any;
  }
  
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: { expiresIn?: string | number; [key: string]: any }
  ): string;
  
  export function verify(
    token: string,
    secretOrPublicKey: string
  ): JwtPayload;
} 