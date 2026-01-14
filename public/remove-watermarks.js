// Aggressive watermark removal script
(function() {
  'use strict';
  
  const removeWatermarks = () => {
    // Remove elements with lovable-related attributes
    const selectors = [
      '[class*="lovable" i]',
      '[id*="lovable" i]',
      '[data-lovable]',
      '[data-watermark]',
      '[data-brand*="lovable" i]',
      'a[href*="lovable" i]',
      '[class*="watermark" i]',
      '[id*="watermark" i]',
    ];
    
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      } catch (e) {
        // Ignore errors
      }
    });

    // Remove suspicious direct children of body
    if (document.body) {
      Array.from(document.body.children).forEach(child => {
        const id = child.id || '';
        const className = typeof child.className === 'string' ? child.className : '';
        const attributes = Array.from(child.attributes || []);
        const hasRadixAttribute = attributes.some(attr => attr.name.startsWith('data-radix'));
        const hasOverlayRole = child.getAttribute && ['tooltip', 'dialog', 'menu'].includes(child.getAttribute('role') || '');
        const isPortalChild = hasRadixAttribute || className.toLowerCase().includes('radix');
        
        // Keep only known safe elements
        const isSafe = 
          id === 'root' ||
          id.includes('radix') ||
          child.hasAttribute('data-sonner-toaster') ||
          child.hasAttribute('data-toast-viewport') ||
          child.tagName === 'SCRIPT' ||
          child.tagName === 'STYLE' ||
          isPortalChild ||
          hasOverlayRole;
        
        if (!isSafe) {
          const text = child.textContent || '';
          const hasLovable = 
            id.toLowerCase().includes('lovable') ||
            className.toLowerCase().includes('lovable') ||
            text.toLowerCase().includes('lovable');
          
          if (hasLovable) {
            try {
              child.parentNode.removeChild(child);
            } catch (e) {
              // Ignore
            }
          }
        }
      });
    }

    // Remove iframes that are not firebase or google
    document.querySelectorAll('iframe').forEach(iframe => {
      const src = iframe.src || '';
      if (!src.includes('firebase') && !src.includes('google')) {
        try {
          iframe.parentNode.removeChild(iframe);
        } catch (e) {
          // Ignore
        }
      }
    });
  };

  // Run immediately
  removeWatermarks();

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeWatermarks);
  } else {
    removeWatermarks();
  }

  // Run periodically
  setInterval(removeWatermarks, 500);

  // Watch for DOM mutations
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(removeWatermarks);
    
    const startObserving = () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'id', 'style']
        });
      } else {
        setTimeout(startObserving, 100);
      }
    };
    
    startObserving();
  }

  // Override console to prevent watermark logging
  const originalLog = console.log;
  console.log = function(...args) {
    const str = args.join(' ').toLowerCase();
    if (!str.includes('lovable') && !str.includes('watermark')) {
      originalLog.apply(console, args);
    }
  };
})();
