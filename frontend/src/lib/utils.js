/**
 * Utility function for merging classNames
 * Similar to shadcn/ui's cn utility
 * Combines class names and handles conditional classes
 */

/**
 * Merges class names together, handling conditional classes
 * @param {...(string|object|undefined|null)} classes - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

