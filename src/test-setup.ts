import '@testing-library/jest-dom';

interface JsdomGlobals {
  jsdom?: {
    window: {
      localStorage: Storage;
    };
  };
}

const jsdomStorage = (globalThis as JsdomGlobals).jsdom?.window.localStorage;

if (!jsdomStorage) {
  throw new Error('jsdom localStorage unavailable in test environment');
}

Object.defineProperty(globalThis, 'localStorage', {
  value: jsdomStorage,
  writable: true,
  configurable: true,
});
