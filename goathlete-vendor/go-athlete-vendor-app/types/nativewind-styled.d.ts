declare module 'nativewind/styled' {
  import { ComponentType } from 'react';
  // Very small shim for the styled helper used in the codebase.
  export function styled<T extends ComponentType<any>>(component: T): T & ((props: any) => any);
}
