/**
 * frontend/src/api/ingest.ts — Knowledge Base Ingestion API Calls
 *
 * Covers:
 *   POST /ingest/files   → ingestFiles()
 *   POST /ingest/urls    → ingestURLs()
 *   GET  /ingest/history → getIngestHistory()
 */

import { api } from './client';
import type { IngestURLsRequest, IngestResponse, IngestionRecord } from '../types';

export const ingestFiles = (files: File[]): Promise<IngestResponse> => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return api
    .post('/ingest/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const ingestURLs = (data: IngestURLsRequest): Promise<IngestResponse> =>
  api.post('/ingest/urls', data).then((r) => r.data);

export const getIngestHistory = (): Promise<IngestionRecord[]> =>
  api.get('/ingest/history').then((r) => r.data);
