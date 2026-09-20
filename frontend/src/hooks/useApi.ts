/**
 * frontend/src/hooks/useApi.ts — Generic API Hook Utilities
 *
 * Lightweight wrappers around react-query patterns shared across pages.
 * Import domain-specific hooks from here rather than duplicating query logic.
 */

import { useQuery } from '@tanstack/react-query';
import { getReviewQueue } from '../api/email';
import { getIngestHistory } from '../api/ingest';
import type { ReviewItem, IngestionRecord } from '../types';

// ── Email ─────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the review queue. Auto-polls every 15 s.
 */
export function useReviewQueue() {
  return useQuery<ReviewItem[]>({
    queryKey: ['review-queue'],
    queryFn: getReviewQueue,
    refetchInterval: 15_000,
  });
}

// ── Ingest ────────────────────────────────────────────────────────────────────

/**
 * Fetch the full ingestion history log.
 */
export function useIngestHistory() {
  return useQuery<IngestionRecord[]>({
    queryKey: ['ingest-history'],
    queryFn: getIngestHistory,
  });
}
