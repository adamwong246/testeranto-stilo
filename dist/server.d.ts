export declare function createFabellibro(port?: number, samplesPath?: string): {
    app: import("express-serve-static-core").Express;
    server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    wss: import("ws").Server<typeof import("ws"), typeof import("http").IncomingMessage>;
    close: () => void;
};
export default createFabellibro;
