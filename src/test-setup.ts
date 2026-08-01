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

// jsdom's Blob does not implement the async `.text()` reader that the spec
// (and our settings export path) relies on. Delegate to a FileReader.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Object.defineProperty(Blob.prototype, 'text', {
    value: function readBlobAsText(this: Blob): Promise<string> {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'));
        reader.readAsText(this);
      });
    },
    writable: true,
    configurable: true,
  });
}
