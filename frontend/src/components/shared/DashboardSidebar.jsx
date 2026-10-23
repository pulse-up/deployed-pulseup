import { Link } from 'react-router-dom';

import '../../styles/components/shared/DashboardSidebar.css';

const ICON_PATHS = {
  overview: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  appointments: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h3m-3 4h7',
  bookings: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 4h3m-3 4h7',
  history: 'M4 12a8 8 0 1 0 2.34-5.66L4 8m0-4v4h4m4-1v5l3 2',
  rewards: 'm12 3 2.1 4.25 4.7.68-3.4 3.32.8 4.68L12 14.7l-4.2 2.23.8-4.68-3.4-3.32 4.7-.68L12 3Z',
  'sick-notes': 'M9 3h6v3h4v15H5V6h4V3Zm0 10h6m-3-3v6',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  availability: 'M12 3v18M3 12h18m-4.2-5.8L7.2 17.8m9.6 0L7.2 6.2',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1a3 3 0 1 0 0-6m-13 17a7 7 0 0 1 14 0m1-7a5 5 0 0 1 5 5',
  slots: 'M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm4 7 2 2 4-5',
  create: 'M12 5v14M5 12h14',
};

function NavIcon({ icon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICON_PATHS[icon] || ICON_PATHS.overview} />
    </svg>
  );
}

function DashboardSidebar({
  activeSection,
  ariaLabel = 'Dashboard navigation',
  items,
  onSelect,
  onSignOut,
}) {
  return (
    <aside className="dashboard-sidebar" aria-label={ariaLabel}>
      <nav className="dashboard-sidebar__navigation">
        {items.map((item) => {
          const active = item.section === activeSection;
          const content = (
            <>
              <NavIcon icon={item.icon || item.section} />
              <span>{item.label}</span>
              {item.badge > 0 && <small>{item.badge}</small>}
            </>
          );

          if (item.to) {
            return (
              <Link className={item.className || ''} to={item.to} key={item.label}>
                {content}
              </Link>
            );
          }

          return (
            <button
              type="button"
              className={`${active ? 'is-active' : ''}${item.className ? ` ${item.className}` : ''}`.trim()}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(item.section)}
              key={item.section}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="dashboard-sidebar__footer">
        <Link to="/" className="dashboard-sidebar__home">← <span>Back to home</span></Link>
        <button type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
