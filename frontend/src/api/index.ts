/**
 * frontend/src/api/index.ts — Public API barrel
 *
 * Re-exports everything so pages can do:
 *   import { processEmail, ingestFiles } from '../api';
 */

export { api } from './client';
export * from './email';
export * from './ingest';
