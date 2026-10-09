import { makeHandler } from './server.mjs';

// Vercel owns the HTTP listener and serves frontend/dist separately.
export default makeHandler({ hosted: true });
