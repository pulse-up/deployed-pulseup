import { useMemo, useState } from 'react';

import '../../styles/components/admin/AdminUserRecords.css';

const CATEGORY_LABELS = {
  ALL: 'All users',
  STUDENT: 'Students',
  STAFF: 'Clinic staff',
  ADMIN: 'Administrators',
};

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function normaliseUsers(students, staff, admins) {
  return [
    ...students.map((record) => ({
      key: `STUDENT-${record.userId}`,
      category: 'STUDENT',
      endpoint: 'students',
      accountNumber: record.studentNumber,
      record,
    })),
    ...staff.map((record) => ({
      key: `STAFF-${record.userId}`,
      category: 'STAFF',
      endpoint: 'staff',
      accountNumber: record.staffNumber,
      record,
    })),
    ...admins.map((record) => ({
      key: `ADMIN-${record.userId}`,
      category: 'ADMIN',
      endpoint: 'admins',
      accountNumber: record.adminNumber,
      record,
    })),
  ].map((entry) => ({
    ...entry,
    name: `${entry.record.firstName || ''} ${entry.record.lastName || ''}`.trim(),
  }));
}

function detailsFor(entry) {
  const { category, record } = entry;
  const common = [
    ['Account number', entry.accountNumber],
    ['Email', record.email],
    ['Phone', record.phoneNumber || 'Not captured'],
    ['Account status', record.active === false ? 'Inactive' : 'Active'],
  ];

  if (category === 'STUDENT') {
    return [
      ...common,
      ['Course', record.course || 'Not captured'],
      ['Year of study', record.yearOfStudy?.replaceAll('_', ' ') || 'Not captured'],
      ['Campus', record.campus || 'Not captured'],
      ['Residence', record.residence || 'Not captured'],
      ['Health Points', record.healthPoints ?? 0],
      ['Emergency contact', record.emergencyContactName || 'Not captured'],
      ['Emergency phone', record.emergencyContactPhone || 'Not captured'],
    ];
  }

  if (category === 'STAFF') {
    return [
      ...common,
      ['Department', record.department || 'Not captured'],
      ['Position', record.position || 'Not captured'],
      ['Specialization', record.specialization || 'Not captured'],
      ['Availability', record.availabilityStatus || 'AVAILABLE'],
    ];
  }

  return [...common, ['Department', record.department || 'Not captured']];
}

function AdminUserRecords({
  admins = [],
  currentAdminId,
  onRemove,
  staff = [],
  students = [],
  workingItem,
}) {
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const users = useMemo(
    () => normaliseUsers(students, staff, admins),
    [admins, staff, students],
  );
  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter((entry) => {
      if (category !== 'ALL' && entry.category !== category) return false;
      if (!search) return true;
      const searchable = [
        entry.name,
        entry.accountNumber,
        entry.record.email,
        entry.record.phoneNumber,
        entry.record.department,
        entry.record.position,
        entry.record.course,
        entry.record.campus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [category, query, users]);
  const selected = users.find((entry) => entry.key === selectedKey) || null;

  return (
    <section className="admin-users" aria-labelledby="admin-users-title">
      <header className="admin-users__toolbar">
        <div>
          <h2 id="admin-users-title">User directory</h2>
          <p>{filteredUsers.length} of {users.length} users</p>
        </div>
        <label className="admin-users__search">
          <span className="visually-hidden">Search users</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, number or email" />
        </label>
      </header>

      <div className="admin-users__categories" aria-label="Filter users by category">
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button type="button" className={category === value ? 'is-active' : ''} onClick={() => { setCategory(value); setSelectedKey(''); }} key={value}>
            {label}<span>{value === 'ALL' ? users.length : users.filter((entry) => entry.category === value).length}</span>
          </button>
        ))}
      </div>

      <div className="admin-users__layout">
        <div className="admin-users__list" aria-label="User results">
          {filteredUsers.length === 0 ? (
            <p className="empty-message">No users match these filters.</p>
          ) : filteredUsers.map((entry) => (
            <button type="button" className={selectedKey === entry.key ? 'is-selected' : ''} onClick={() => setSelectedKey(entry.key)} key={entry.key}>
              <span className={`admin-users__avatar is-${entry.category.toLowerCase()}`}>{initials(entry.name)}</span>
              <span className="admin-users__summary"><strong>{entry.name}</strong><small>{entry.accountNumber} · {entry.record.email}</small></span>
              <span className={`admin-users__role is-${entry.category.toLowerCase()}`}>{CATEGORY_LABELS[entry.category]}</span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>

        <aside className="admin-users__detail" aria-live="polite">
          {!selected ? (
            <div className="admin-users__empty-detail">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" /></svg>
              <strong>Select a user</strong>
              <span>Full account details will appear here.</span>
            </div>
          ) : (
            <>
              <header>
                <span className={`admin-users__avatar is-${selected.category.toLowerCase()}`}>{initials(selected.name)}</span>
                <div><strong>{selected.name}</strong><span>{CATEGORY_LABELS[selected.category]}</span></div>
              </header>
              <dl>
                {detailsFor(selected).map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
              {!(selected.category === 'ADMIN' && String(selected.record.userId) === String(currentAdminId)) && (
                <button
                  type="button"
                  className="danger-button admin-users__remove"
                  disabled={workingItem === `${selected.endpoint}-${selected.record.userId}`}
                  onClick={() => onRemove(selected.endpoint, selected.record.userId, selected.name)}
                >
                  {workingItem === `${selected.endpoint}-${selected.record.userId}` ? 'Removing…' : 'Remove account'}
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

export default AdminUserRecords;
