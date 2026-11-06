/**
 * Dev proxy: browser calls relative /api/* → sandbox API on :8787.
 * Injects the owner token server-side so the browser NEVER sees credentials.
 * Supports both config dialects (http-proxy-middleware & Vite/http-proxy):
 *   - pathRewrite / onProxyReq  (older Angular dev-server)
 *   - rewrite / configure      (Vite-based dev server, Angular 17+)
 * (Production will replace this with a real login flow — docs/04 §5.)
 */
const TARGET = "http://127.0.0.1:8787";
const TOKEN = process.env.JARVIS_OWNER_TOKEN || "jarvis-local-dev";

module.exports = {
  "/api": {
    target: TARGET,
    secure: false,
    changeOrigin: true,
    // dialect 1: http-proxy-middleware
    pathRewrite: { "^/api": "" },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("authorization", `Bearer ${TOKEN}`);
    },
    // dialect 2: Vite / http-proxy
    rewrite: (path) => path.replace(/^\/api/, ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader("authorization", `Bearer ${TOKEN}`);
      });
    },
  },
};
