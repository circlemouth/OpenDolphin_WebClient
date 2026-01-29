import '@testing-library/jest-dom/vitest';

// BroadcastChannel が Node 環境で Event インスタンスを要求して失敗するため、テストでは簡易モックを適用
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.BroadcastChannel = MockBroadcastChannel;
