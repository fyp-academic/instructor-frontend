import { useState, useEffect, useCallback } from 'react';

interface UseJitsiScriptResult {
  loaded: boolean;
  error: Error | null;
}

/**
 * Hook to dynamically load Jitsi External API script
 * Returns { loaded, error } status
 * Skips load if window.JitsiMeetExternalAPI already exists
 */
export function useJitsiScript(domain?: string): UseJitsiScriptResult {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const jitsiDomain = domain || import.meta.env.VITE_JITSI_DOMAIN || 'meet.codagenz.com';

  useEffect(() => {
    // Guard: Check if API already loaded
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).JitsiMeetExternalAPI) {
      setLoaded(true);
      return;
    }

    // Guard: Check if script already being loaded
    const existingScript = document.querySelector(`script[src*="${jitsiDomain}/external_api.js"]`);
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = setInterval(() => {
        if ((window as unknown as Record<string, unknown>).JitsiMeetExternalAPI) {
          setLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!(window as unknown as Record<string, unknown>).JitsiMeetExternalAPI) {
          setError(new Error('Jitsi script loading timeout'));
        }
      }, 10000);

      return () => clearInterval(checkLoaded);
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://${jitsiDomain}/external_api.js`;
    script.async = true;

    script.onload = () => {
      setLoaded(true);
      setError(null);
    };

    script.onerror = () => {
      setError(new Error(`Failed to load Jitsi script from ${jitsiDomain}`));
      setLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - other components might need it
      // Just cleanup is fine
    };
  }, [jitsiDomain]);

  return { loaded, error };
}

export default useJitsiScript;
