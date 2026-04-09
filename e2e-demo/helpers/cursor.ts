import type { Page } from "@playwright/test";

/**
 * Inject a visible fake cursor and click ripple effect into the page.
 * Re-injects on every navigation (via page.on("load")).
 */
export async function injectCursor(page: Page): Promise<void> {
  const inject = async () => {
    await page.evaluate(() => {
      // Don't inject twice
      if (document.getElementById("__demo-cursor")) return;

      // --- Cursor element ---
      const cursor = document.createElement("div");
      cursor.id = "__demo-cursor";
      Object.assign(cursor.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "20px",
        height: "20px",
        pointerEvents: "none",
        zIndex: "2147483647",
        transform: "translate(-2px, -2px)",
        transition: "left 0.08s ease-out, top 0.08s ease-out",
      });
      cursor.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L8.5 18L10.5 11L17.5 9L2 2Z" fill="black" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
      document.body.appendChild(cursor);

      // --- Click ripple styles ---
      const style = document.createElement("style");
      style.id = "__demo-cursor-style";
      style.textContent = `
        @keyframes __demo-ripple {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        .__demo-click-ripple {
          position: fixed;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.5);
          pointer-events: none;
          z-index: 2147483646;
          animation: __demo-ripple 0.4s ease-out forwards;
        }
      `;
      document.head.appendChild(style);

      // --- Track mouse movement ---
      document.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      }, true);

      // --- Show ripple on click ---
      document.addEventListener("mousedown", (e) => {
        const ripple = document.createElement("div");
        ripple.className = "__demo-click-ripple";
        ripple.style.left = e.clientX + "px";
        ripple.style.top = e.clientY + "px";
        document.body.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      }, true);
    }).catch(() => {}); // ignore if page is navigating
  };

  // Inject on current page and re-inject after every navigation
  await inject();
  page.on("load", () => inject());
}
