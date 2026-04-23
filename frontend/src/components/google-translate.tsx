"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const LANG_MAP: Record<string, string> = {
  English: 'en',
  Hindi: 'hi',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Malayalam: 'ml',
  Marathi: 'mr',
  Bengali: 'bn',
  Gujarati: 'gu',
  Punjabi: 'pa',
  Odia: 'or',
  Urdu: 'ur'
};

export function GoogleTranslate() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const prefLang = user.preferred_language || 'English';
    const code = LANG_MAP[prefLang] || 'en';
    
    // Set cookies for immediate Google Translate load behavior
    if (code === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/;`;
      document.cookie = `googtrans=/en/${code}; path=/; domain=${window.location.hostname}`;
    }

    // Inject the script only once per page session
    if (!document.getElementById('google-translate-script')) {
      
      // MONKEY PATCH FOR REACT HYDRATION ISSUES WITH GOOGLE TRANSLATE
      if (typeof Node === 'function' && Node.prototype) {
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
          if (child.parentNode !== this) {
            return child;
          }
          return originalRemoveChild.apply(this, arguments as any) as T;
        };
        
        const originalInsertBefore = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
          if (referenceNode && referenceNode.parentNode !== this) {
            return newNode;
          }
          return originalInsertBefore.apply(this, arguments as any) as T;
        };
      }

      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.position = 'absolute'; 
      translateDiv.style.opacity = '0';
      translateDiv.style.zIndex = '-999';
      translateDiv.style.pointerEvents = 'none';
      document.body.appendChild(translateDiv);
      
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          autoDisplay: false
        }, 'google_translate_element');
      };

      const script = document.createElement("script");
      script.id = 'google-translate-script';
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
      
      // Add custom styles to hide the pesky Google Translate top banner in the DOM
      const style = document.createElement('style');
      style.innerHTML = `
        .skiptranslate { display: none !important; }
        body { top: 0px !important; }
        #goog-gt-tt { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
      `;
      document.head.appendChild(style);
    }

    // Continuously try to trigger translation via the dropdown until successful
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      
      if (select) {
        if (select.value !== code) {
          select.value = code;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        clearInterval(interval);
      }
      
      if (attempts > 50) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [user]);

  return null;
}
