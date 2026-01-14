import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./hide-watermarks.css";
import "./radix-ui-fix.css";

// Aggressive watermark removal
const removeWatermarks = () => {
  // Remove any elements with lovable in class, id, or data attributes
  const selectors = [
    '[class*="lovable" i]',
    '[id*="lovable" i]',
    '[data-lovable]',
    '[data-watermark]',
    '[data-brand*="lovable" i]',
    'a[href*="lovable" i]',
  ];
  
  selectors.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        const element = el as HTMLElement;
        const root = element.closest?.('[data-radix-portal], [data-radix-popper-content], [id*="radix" i]');
        const role = element.getAttribute?.('role') || '';
        const isRadixOverlay = role === 'dialog' || role === 'menu' || role === 'tooltip';
        if (root || isRadixOverlay) return;
        element.remove();
      });
    } catch (e) {
      // Ignore errors
    }
  });
};

// Run immediately
removeWatermarks();

// Run after DOM is loaded
document.addEventListener('DOMContentLoaded', removeWatermarks);

// Run periodically to catch dynamically added watermarks
setInterval(removeWatermarks, 1000);

// Watch for DOM changes
const observer = new MutationObserver(removeWatermarks);
const startObserver = () => {
  if (!document.body) return;
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};
if (document.body) {
  startObserver();
} else {
  document.addEventListener('DOMContentLoaded', startObserver, { once: true });
}

createRoot(document.getElementById("root")!).render(<App />);
