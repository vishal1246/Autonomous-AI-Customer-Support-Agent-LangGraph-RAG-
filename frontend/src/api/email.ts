/**
 * frontend/src/api/email.ts — Email Agent API Calls
 *
 * Covers:
 *   POST /process-email  → processEmail()
 *   POST /resume-email   → resumeEmail()
 *   GET  /review-queue   → getReviewQueue()
 */

import { api } from './client';
import type { EmailRequest, EmailResponse, ResumeRequest, ReviewItem } from '../types';

export const processEmail = (data: EmailRequest): Promise<EmailResponse> =>
  api.post('/process-email', data).then((r) => r.data);

export const resumeEmail = (data: ResumeRequest): Promise<EmailResponse> =>
  api.post('/resume-email', data).then((r) => r.data);

export const getReviewQueue = (): Promise<ReviewItem[]> =>
  api.get('/review-queue').then((r) => r.data);
