import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function mirrorOutput() {
  // Support Vercel projects rooted at either the repository or frontend.
  cpSync(fileURLToPath(new URL('../dist/', import.meta.url)), fileURLToPath(new URL('../../dist/', import.meta.url)), { recursive: true });
}
