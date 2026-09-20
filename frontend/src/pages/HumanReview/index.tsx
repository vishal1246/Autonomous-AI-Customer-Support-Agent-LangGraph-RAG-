import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resumeEmail, getReviewQueue } from '../../api/email';
import type { ReviewItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './HumanReview.css';



const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'] as const;

const borderColors: Record<string, string> = {
  critical: 'var(--color-critical)', high: 'var(--color-high)',
  medium: 'var(--color-medium)', low: 'var(--color-low)',
};

function ReviewCard({ item, onResolved }: { item: ReviewItem; onResolved: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [edited, setEdited] = useState(item.draft_response);
  const [editing, setEditing] = useState(false);

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => resumeEmail({ thread_id: item.thread_id, approved: true, edited_response: edited }),
    onSuccess: () => {
      toast.success('Reply approved & sent!');
      onResolved(item.email_id);
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rejectMutation = useMutation({
    mutationFn: () => resumeEmail({ thread_id: item.thread_id, approved: false }),
    onSuccess: () => {
      toast('Email rejected — handle directly.', { icon: '🚫' });
      onResolved(item.email_id);
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <motion.div
      className="review-card card"
      style={{ borderLeft: `3px solid ${borderColors[item.classification.urgency] ?? 'var(--color-border)'}` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <div className="review-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <span className="review-sender">{item.sender_email}</span>
          <span className="review-time">{item.timestamp}</span>
        </div>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <span className={`badge badge-${item.classification.urgency}`}>{item.classification.urgency}</span>
          <span className={`badge badge-${item.classification.intent}`}>{item.classification.intent}</span>
          {expanded ? <ChevronUp size={16} color="var(--color-text-tertiary)" /> : <ChevronDown size={16} color="var(--color-text-tertiary)" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="review-card-body">
              {/* Original email */}
              <div>
                <div className="section-label">Original Email</div>
                <p className="review-original">{item.email_content}</p>
              </div>

              <div className="divider" />

              {/* AI Draft */}
              <div>
                <div className="row-between">
                  <div className="section-label" style={{ marginBottom: 0 }}>AI Draft Response</div>
                  <button className="btn-text" onClick={() => setEditing(e => !e)}>
                    {editing ? 'Cancel editing' : 'Edit response'}
                  </button>
                </div>
                {editing ? (
                  <textarea
                    className="form-input"
                    value={edited}
                    onChange={e => setEdited(e.target.value)}
                    rows={8}
                    style={{ marginTop: 'var(--space-3)', fontFamily: 'inherit' }}
                  />
                ) : (
                  <div className="draft-response" style={{ marginTop: 'var(--space-3)' }}>{edited}</div>
                )}
              </div>

              {/* Actions */}
              <div className="review-actions">
                <div className="row">
                  <button className="btn btn-primary" onClick={() => approveMutation.mutate()} disabled={isPending}>
                    <CheckCircle size={15} /> {approveMutation.isPending ? 'Sending…' : 'Approve & Send'}
                  </button>
                  <button className="btn btn-danger-outline" onClick={() => rejectMutation.mutate()} disabled={isPending}>
                    <XCircle size={15} /> {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
                {item.jira_ticket && (
                  <a href={`${import.meta.env.VITE_JIRA_URL ?? '#'}/browse/${item.jira_ticket}`} target="_blank" rel="noreferrer" className="jira-link">
                    <ExternalLink size={13} /> View Jira Ticket {item.jira_ticket}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HumanReview() {
  const [filter, setFilter] = useState<string>('All');

  const { data: items = [], isLoading, isError, refetch, isFetching } = useQuery<ReviewItem[]>({
    queryKey: ['review-queue'],
    queryFn: getReviewQueue,
    refetchInterval: 15_000, // auto-poll every 15s for new emails
  });

  const resolved = (_id: string) => {
    // optimistic: query invalidation from mutations handles the real update
  };

  const visible = filter === 'All'
    ? items
    : items.filter(i => i.classification.urgency === filter.toLowerCase());

  return (
    <div>
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1 className="page-title">Human Review</h1>
            <p className="page-subtitle">
              {isLoading ? 'Loading…' : `${items.length} email${items.length !== 1 ? 's' : ''} awaiting your review`}
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh queue"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {isError && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-critical)', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-critical)', margin: 0 }}>
            ⚠️ Failed to load review queue. Make sure the backend is running and try refreshing.
          </p>
        </div>
      )}

      <div className="chip-row">
        {FILTERS.map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="stack">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="card">
              <div className="empty-state">
                <RefreshCw size={32} color="var(--color-text-tertiary)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--color-text-tertiary)' }}>Loading emails…</p>
              </div>
            </div>
          ) : visible.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle size={40} className="empty-state-icon" color="var(--color-success)" />
                <p>No emails to review. You're all caught up! 🎉</p>
              </div>
            </div>
          ) : (
            visible.map(item => (
              <ReviewCard key={item.email_id} item={item} onResolved={resolved} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
