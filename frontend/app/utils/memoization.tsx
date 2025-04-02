import React, { memo, ComponentType } from 'react';

/**
 * Creates a memoized component with proper display name
 * @param Component The component to memoize
 * @param propsAreEqual Optional comparison function for props
 * @returns Memoized component
 */
export function memoizeComponent<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<ComponentType<P>> {
  const MemoizedComponent = memo(Component, propsAreEqual);
  
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`;
  
  return MemoizedComponent;
}

/**
 * Deep compares two objects for equality
 * Useful for memoization comparisons
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }
  
  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) return false;
  }
  
  return true;
}

/**
 * Creates a props comparator function for array props
 * Compares specified array props by their length and content identity
 * @param arrayPropNames Names of array props to compare
 * @returns Props comparison function
 */
export function createArrayPropsComparator<P extends object>(
  arrayPropNames: (keyof P)[]
): (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>) => {
    const allPropNames = Object.keys(prevProps) as (keyof P)[];
    
    for (const propName of allPropNames) {
      if (!arrayPropNames.includes(propName)) {
        if (prevProps[propName] !== nextProps[propName]) {
          return false;
        }
      }
    }
    
    for (const arrayProp of arrayPropNames) {
      const prevArray = prevProps[arrayProp] as unknown as unknown[];
      const nextArray = nextProps[arrayProp] as unknown as unknown[];
      
      if (!prevArray || !nextArray) return false;
      if (prevArray.length !== nextArray.length) return false;
      
      for (let i = 0; i < prevArray.length; i++) {
        if (prevArray[i] !== nextArray[i]) return false;
      }
    }
    
    return true;
  };
} 