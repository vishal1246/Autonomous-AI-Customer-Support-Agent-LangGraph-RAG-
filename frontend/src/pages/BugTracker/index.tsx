import { ExternalLink, CheckCircle, Mail } from 'lucide-react';
import type { BugTicket } from '../../types';
import './BugTracker.css';

const JIRA_URL = import.meta.env.VITE_JIRA_URL || 'https://yourcompany.atlassian.net';

const MOCK_BUGS: BugTicket[] = [
  { ticket_id: 'BUG-47291', summary: 'Analytics page 500 error after v2.4.1 deploy', sender: 'bob@startup.io',      urgency: 'high',     created_at: 'Today, 2:14 PM',       email_notified: true,  jira_url: `${JIRA_URL}/browse/BUG-47291` },
  { ticket_id: 'BUG-47285', summary: 'Login loop on Safari 17 with SSO enabled',     sender: 'alice@techcorp.com', urgency: 'critical', created_at: 'Today, 11:02 AM',      email_notified: true,  jira_url: `${JIRA_URL}/browse/BUG-47285` },
  { ticket_id: 'BUG-47270', summary: 'CSV export truncates records over 10k rows',   sender: 'dan@smb.net',        urgency: 'medium',   created_at: 'Yesterday, 4:30 PM',   email_notified: false, jira_url: `${JIRA_URL}/browse/BUG-47270` },
  { ticket_id: 'BUG-47261', summary: 'Webhook payload missing metadata field',       sender: 'eva@bigcorp.com',    urgency: 'high',     created_at: 'Yesterday, 1:18 PM',   email_notified: true,  jira_url: `${JIRA_URL}/browse/BUG-47261` },
  { ticket_id: 'BUG-47255', summary: 'Notification emails delayed by 30+ minutes',   sender: 'frank@agency.io',    urgency: 'medium',   created_at: '2 days ago, 9:05 AM',  email_notified: false, jira_url: `${JIRA_URL}/browse/BUG-47255` },
];

const urgencyStyle: Record<string, string> = {
  critical: 'var(--color-critical)',
  high: 'var(--color-high)',
  medium: 'var(--color-medium)',
  low: 'var(--color-low)',
};

export default function BugTracker() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bug Tracker</h1>
        <p className="page-subtitle">Bugs automatically created by the AI agent and synced to Jira.</p>
      </div>

      {/* Jira Integration Card */}
      <div className="card jira-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body jira-card-body">
          <div className="jira-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#0052CC"/>
              <path d="M14.5 7L8 14.5l6.5 7 6.5-7L14.5 7z" fill="white" opacity="0.6"/>
              <path d="M14.5 7L8 14.5h6.5V7z" fill="white"/>
            </svg>
          </div>
          <div className="jira-info">
            <div className="jira-title">Jira Integration</div>
            <div className="jira-subtitle">Track and manage bugs in your Jira workspace</div>
            <a href={JIRA_URL} className="jira-url" target="_blank" rel="noreferrer">{JIRA_URL}</a>
          </div>
          <a href={`${JIRA_URL}/jira/software/projects`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', flexShrink: 0 }}>
            Open Jira Dashboard <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Bugs Table */}
      <div className="card">
        <div className="card-header">Bugs Created by AI Agent <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>{MOCK_BUGS.length} tickets</span></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Summary</th>
              <th>Sender</th>
              <th>Urgency</th>
              <th>Created</th>
              <th>Email Notification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_BUGS.map(bug => (
              <tr key={bug.ticket_id}>
                <td>
                  <span className="ticket-id">{bug.ticket_id}</span>
                </td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.summary}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{bug.sender}</td>
                <td>
                  <span style={{ color: urgencyStyle[bug.urgency], fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    {bug.urgency.charAt(0).toUpperCase() + bug.urgency.slice(1)}
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>{bug.created_at}</td>
                <td>
                  {bug.email_notified ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
                      <CheckCircle size={13} /> Sent
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                      <Mail size={13} /> Notified
                    </span>
                  )}
                </td>
                <td>
                  {bug.jira_url && (
                    <a href={bug.jira_url} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--color-accent)', fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      View in Jira <ExternalLink size={12} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="pagination-btn">‹</button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">3</button>
          <button className="pagination-btn">›</button>
        </div>
      </div>
    </div>
  );
}
