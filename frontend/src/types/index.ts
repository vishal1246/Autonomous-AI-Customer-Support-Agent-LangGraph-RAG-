// ─── Shared TypeScript Interfaces ───────────────────────────────────────────

export interface EmailRequest {
  email_content: string;
  sender_email: string;
  email_id?: string;
}

export interface EmailResponse {
  email_id: string;
  thread_id: string;
  draft_response: string | null;
  classification: Classification | null;
  requires_human_review: boolean;
}

export interface Classification {
  intent: 'question' | 'bug' | 'billing' | 'feature' | 'complex';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  topic: string;
  summary: string;
}

export interface ResumeRequest {
  thread_id: string;
  approved: boolean;
  edited_response?: string;
}

export interface IngestResponse {
  message: string;
  chunks_stored: number;
}

export interface IngestURLsRequest {
  urls: string[];
}

export interface ReviewItem {
  email_id: string;
  thread_id: string;
  sender_email: string;
  email_content: string;
  draft_response: string;
  classification: Classification;
  timestamp: string;
  jira_ticket?: string;
}

export interface BugTicket {
  ticket_id: string;
  summary: string;
  sender: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  email_notified: boolean;
  jira_url?: string;
}

export interface IngestionRecord {
  id: string;
  source: string;
  type: 'file' | 'url';
  chunks_stored: number;
  status: 'success' | 'processing' | 'failed';
  timestamp: string;
}
