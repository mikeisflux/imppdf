/* Browser gaps that break the app, filled in before anything can trip on them.

   Map.prototype.getOrInsertComputed / getOrInsert
   ----------------------------------------------
   pdfjs-dist 6 calls these on every worker message dispatch. They are a very
   recent proposal: Chromium 141 — a current, shipping browser — does not have
   them. The failure mode is nasty because it is not immediate: opening the
   FIRST PDF works, and every one after it throws

       this[#methodPromises].getOrInsertComputed is not a function

   because the message handler only reaches for the cache on a second document.
   So the app looks fine, the operator loads another file, and every tool that
   touches pdfjs — the previews, Divinity Box, Raised Metal, Remove Background,
   Color Effects, Trim to Artwork — dies at once. Found by running the engine
   in real Chromium; node has the methods, so no amount of node testing would
   have shown it.

   Both are tiny and exactly specified, so implementing them is safe: they are
   only defined when missing, and a browser that already has them is untouched. */

interface MapWithGetOrInsert<K, V> extends Map<K, V> {
  getOrInsert?(key: K, value: V): V;
  getOrInsertComputed?(key: K, make: (key: K) => V): V;
}

export function installPolyfills(): void {
  const proto = Map.prototype as unknown as MapWithGetOrInsert<unknown, unknown>;

  if (typeof proto.getOrInsert !== 'function') {
    Object.defineProperty(Map.prototype, 'getOrInsert', {
      configurable: true, writable: true,
      value: function getOrInsert(this: Map<unknown, unknown>, key: unknown, value: unknown) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }

  if (typeof proto.getOrInsertComputed !== 'function') {
    Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
      configurable: true, writable: true,
      value: function getOrInsertComputed(
        this: Map<unknown, unknown>, key: unknown, make: (key: unknown) => unknown,
      ) {
        if (!this.has(key)) this.set(key, make(key));
        return this.get(key);
      },
    });
  }
}

installPolyfills();
