import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Node 26 traz um localStorage global experimental que fica indefinido sem a flag
// --localstorage-file e encobre o do jsdom. Nos testes, usamos o do jsdom.
const jsdomGlobal = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (jsdomGlobal && typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: jsdomGlobal.window.localStorage,
    configurable: true,
  });
}
