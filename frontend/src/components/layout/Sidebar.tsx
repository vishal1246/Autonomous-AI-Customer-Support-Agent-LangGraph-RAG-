import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Mail, Eye, BookOpen, Bug,
} from 'lucide-react';
import './Sidebar.css';

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/process-email', icon: Mail,            label: 'Process Email' },
  { to: '/human-review',  icon: Eye,             label: 'Human Review', badge: true },
  { to: '/knowledge-base',icon: BookOpen,        label: 'Knowledge Base' },
  { to: '/bug-tracker',   icon: Bug,             label: 'Bug Tracker' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">S</span>
        <span className="sidebar-logo-text">SupportAI</span>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {badge && <span className="sidebar-badge" />}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">A</div>
          <div>
            <div className="sidebar-user-name">Agent</div>
            <div className="sidebar-user-role">Support Team</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
