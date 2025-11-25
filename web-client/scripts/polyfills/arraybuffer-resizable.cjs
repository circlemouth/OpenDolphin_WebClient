// Minimal polyfill for ArrayBuffer resizable APIs to satisfy jsdom on Node <20.
(() => {
  if (typeof ArrayBuffer === "undefined") return;

  const proto = ArrayBuffer.prototype;

  if (!Object.prototype.hasOwnProperty.call(proto, "resizable")) {
    Object.defineProperty(proto, "resizable", {
      configurable: true,
      get() {
        return false;
      },
    });
  }

  if (!Object.prototype.hasOwnProperty.call(proto, "maxByteLength")) {
    Object.defineProperty(proto, "maxByteLength", {
      configurable: true,
      get() {
        return this.byteLength;
      },
    });
  }

  if (!Object.prototype.hasOwnProperty.call(proto, "resize")) {
    Object.defineProperty(proto, "resize", {
      configurable: true,
      writable: true,
      value(newLength) {
        if (newLength !== this.byteLength) {
          throw new TypeError("Resizable ArrayBuffer is not supported");
        }
        return this.byteLength;
      },
    });
  }
})();
