import { useEffect } from 'react';

/**
 * Sets document.title for the current page and restores the default
 * instructor-portal title on unmount. The instructor app is noindex, so a
 * lightweight document.title is enough (no react-helmet/SEO lib needed).
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
