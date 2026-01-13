import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./hide-watermarks.css";

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
  
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.remove();
      });
    } catch (e) {
      // Ignore errors
    }
  });

  // Remove any direct children of body that are not #root or known elements
  Array.from(document.body.children).forEach(child => {
    if (
      child.id !== 'root' &&
      !child.hasAttribute('data-sonner-toaster') &&
      !child.hasAttribute('data-toast-viewport') &&
      !child.id.includes('radix')
    ) {
      const tagName = child.tagName.toLowerCase();
      if (tagName === 'div' || tagName === 'iframe' || tagName === 'a') {
        child.remove();
      }
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
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

createRoot(document.getElementById("root")!).render(<App />);
