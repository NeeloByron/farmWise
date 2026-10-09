import { makeHandler } from './server.mjs';

// Vercel owns the HTTP listener and serves the root dist directory separately.
export default makeHandler({ hosted: true });
