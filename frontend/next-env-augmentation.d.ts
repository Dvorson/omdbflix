// Type fixes for Next.js auto-generated types
// This helps avoid errors in the .next/types folder

import { ParsedUrlQuery } from 'querystring';

declare module 'next/dist/server/api-utils' {
  export interface PageParams extends Promise<any> {}
}

declare module 'next/dist/server/future/route-modules/route-module' {
  export interface RouteParams extends Promise<any> {}
}

declare module 'next/dist/server/future/route-modules/app-page/module' {
  export interface PageParams extends Promise<any> {}
}

declare module 'next/dist/server/future/route-modules/app-route/module' {
  export interface PathParams extends Promise<any> {}
}

declare module 'next/dist/server/future/route-modules/pages/module' {
  export interface Params extends Promise<any> {}
} 