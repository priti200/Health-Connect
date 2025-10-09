declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
  }

  class SockJS {
    constructor(url: string, _reserved?: any, options?: SockJSOptions);
    
    send(data: string): void;
    close(code?: number, reason?: string): void;
    
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    
    readyState: number;
    protocol: string;
    url: string;
    
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
  }

  export = SockJS;
}
