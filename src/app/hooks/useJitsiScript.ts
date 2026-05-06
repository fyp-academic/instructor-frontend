import { useState, useEffect, useCallback } from 'react';

interface UseJitsiScriptResult {
  loaded: boolean;
  error: Error | null;
  domain: string;
}

/**
 * Hook to dynamically load Jitsi External API script
 * Returns { loaded, error, domain } status
 * Skips load if window.JitsiMeetExternalAPI already exists
 * 
 * Troubleshooting:
 * - Ensure VITE_JITSI_DOMAIN environment variable is set
 * - Verify Jitsi server is running and accessible at the domain
 * - Check DNS resolution: nslookup meet.codagenz.com
 * - Check browser console for CORS errors
 * - If Jitsi server is behind firewall, ensure port 443 (HTTPS) is open
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
      const timeoutId = setTimeout(() => {
        clearInterval(checkLoaded);
        if (!(window as unknown as Record<string, unknown>).JitsiMeetExternalAPI) {
          const timeoutError = new Error(
            `Jitsi script loading timeout (10s). Domain: ${jitsiDomain}. ` +
            `Check if the Jitsi server is running and accessible. ` +
            `Verify VITE_JITSI_DOMAIN environment variable is set correctly.`
          );
          setError(timeoutError);
        }
      }, 10000);

      return () => {
        clearInterval(checkLoaded);
        clearTimeout(timeoutId);
      };
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://${jitsiDomain}/external_api.js`;
    script.async = true;

    script.onload = () => {
      // Give it a moment to initialize
      setTimeout(() => {
        if ((window as unknown as Record<string, unknown>).JitsiMeetExternalAPI) {
          setLoaded(true);
          setError(null);
          console.log(`✓ Jitsi script loaded successfully from ${jitsiDomain}`);
        } else {
          const initError = new Error(
            `Jitsi API failed to initialize after script load from ${jitsiDomain}. ` +
            `The script loaded but JitsiMeetExternalAPI is not available. ` +
            `This may indicate a problem with the Jitsi server configuration.`
          );
          setError(initError);
          setLoaded(false);
        }
      }, 500);
    };

    script.onerror = () => {
      const loadError = new Error(
        `Failed to load Jitsi script from https://${jitsiDomain}/external_api.js. ` +
        `Possible causes:\n` +
        `1. Jitsi server at ${jitsiDomain} is not running\n` +
        `2. DNS resolution failed for ${jitsiDomain}\n` +
        `3. Network connectivity issue\n` +
        `4. CORS policy blocking the request\n` +
        `5. VITE_JITSI_DOMAIN environment variable is not set correctly\n\n` +
        `Debugging steps:\n` +
        `- Check browser console for detailed error\n` +
        `- Verify domain in .env file: ${jitsiDomain}\n` +
        `- Test connectivity: curl https://${jitsiDomain}/external_api.js\n` +
        `- Check DNS: nslookup ${jitsiDomain}`
      );
      console.error('Jitsi script load error:', loadError);
      setError(loadError);
      setLoaded(false);
    };

    // Log what we're attempting to load
    console.log(`Loading Jitsi external API from: https://${jitsiDomain}/external_api.js`);

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - other components might need it
      // Just cleanup is fine
    };
  }, [jitsiDomain]);

  return { loaded, error, domain: jitsiDomain };
}

export default useJitsiScript;
