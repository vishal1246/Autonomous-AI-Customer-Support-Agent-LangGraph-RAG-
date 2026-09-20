import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Mail, Eye, CheckCircle, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';

const barData = [
  { name: 'Question', count: 68 },
  { name: 'Bug', count: 34 },
  { name: 'Billing', count: 22 },
  { name: 'Feature', count: 12 },
  { name: 'Complex', count: 6 },
];

const pieData = [
  { name: 'Auto-Resolved', value: 128, color: '#188038' },
  { name: 'Pending Review', value: 7, color: '#e37400' },
  { name: 'Bug Tickets', value: 14, color: '#d93025' },
  { name: 'In Progress', value: 7, color: '#1a73e8' },
];

const activity = [
  { sender: 'alice@techcorp.com', subject: 'Login not working after update', intent: 'bug', urgency: 'critical', time: '2 min ago', status: 'Review Needed' },
  { sender: 'bob@startup.io',     subject: 'How to export my data?',         intent: 'question', urgency: 'low',      time: '14 min ago', status: 'Resolved' },
  { sender: 'carol@enterprise.com', subject: 'Double charged last month',    intent: 'billing', urgency: 'high',     time: '31 min ago', status: 'Review Needed' },
  { sender: 'dan@smb.net',        subject: 'Feature request: dark mode',     intent: 'feature', urgency: 'low',      time: '1h ago',     status: 'Resolved' },
  { sender: 'eva@bigcorp.com',    subject: 'API latency spikes overnight',   intent: 'bug',     urgency: 'high',     time: '2h ago',     status: 'Ticket Created' },
];

const stats = [
  { label: 'Processed Today', value: 142, icon: Mail,        color: '#1a73e8', borderColor: '#1a73e8' },
  { label: 'Pending Review',  value: 7,   icon: Eye,         color: '#e37400', borderColor: '#e37400' },
  { label: 'Auto-Resolved',   value: 128, icon: CheckCircle, color: '#188038', borderColor: '#188038' },
  { label: 'Bug Tickets',     value: 14,  icon: Bug,         color: '#d93025', borderColor: '#d93025' },
];

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="card stat-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ borderTop: `3px solid ${s.borderColor}` }}
          >
            <div className="card-body stat-card-body">
              <div className="stat-card-top">
                <span className="stat-card-label">{s.label}</span>
                <s.icon size={16} color={s.color} />
              </div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">Email Volume by Category</div>
          <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e8eaed', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 13 }}
                  cursor={{ fill: 'rgba(26,115,232,0.05)' }}
                />
                <Bar dataKey="count" fill="#1a73e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Resolution Status</div>
          <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#5f6368' }}>{v}</span>} />
                <Tooltip contentStyle={{ border: '1px solid #e8eaed', borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card">
        <div className="card-header">Recent Activity</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((row) => (
              <tr key={row.sender + row.time}>
                <td style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{row.sender}</td>
                <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.subject}</td>
                <td><span className={`badge badge-${row.intent}`}>{row.intent}</span></td>
                <td><span style={{ color: `var(--color-${row.urgency === 'critical' ? 'critical' : row.urgency === 'high' ? 'high' : row.urgency === 'medium' ? 'medium' : 'success'})`, fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{row.urgency}</span></td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{row.time}</td>
                <td>
                  <span className={`badge ${row.status === 'Resolved' ? 'badge-success' : row.status === 'Ticket Created' ? 'badge-neutral' : 'badge-warning'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
