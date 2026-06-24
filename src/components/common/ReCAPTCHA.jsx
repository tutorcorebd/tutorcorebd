import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const ReCAPTCHA = forwardRef(({ action = 'submit' }, ref) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lcq0DItAAAAALZNiVnbySCWWvcsBRyKU7rjF5AV';
  const executePromiseRef = useRef(null);

  useImperativeHandle(ref, () => ({
    execute: async () => {
      if (!window.grecaptcha) {
        console.error('reCAPTCHA v3 script is not loaded yet');
        throw new Error('reCAPTCHA is loading. Please try again.');
      }
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(siteKey, { action });
            resolve(token);
          } catch (err) {
            console.error('reCAPTCHA v3 execution error:', err);
            reject(err);
          }
        });
      });
    }
  }));

  useEffect(() => {
    if (!siteKey) {
      console.warn('VITE_RECAPTCHA_SITE_KEY is not defined. reCAPTCHA v3 will not load.');
      return;
    }

    const scriptId = 'recaptcha-v3-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    return () => {
      // Clean up script if component unmounts? Usually we keep it loaded for session longevity.
    };
  }, [siteKey]);

  return null; // reCAPTCHA v3 runs entirely in the background and has no checkbox UI
});

ReCAPTCHA.displayName = 'ReCAPTCHA';

export default ReCAPTCHA;
