import "@testing-library/jest-dom/vitest";

// vitest 4.x jsdom environment does not provide a proper Storage implementation
if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.setItem !== "function") {
  const createStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    };
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: createStorage(),
    writable: true,
  });
}
