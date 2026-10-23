const USER_STORAGE_KEY = 'pulseupUser';
const MIGRATION_STORAGE_KEYS = [
  'darkMode',
  'pulseupAdminTheme',
  'pulseupLocalAccounts',
];

export function normalizeRole(role) {
  return String(role || '').trim().toUpperCase().replace(/^ROLE_/, '');
}

export function getToken(user = getStoredUser()) {
  return user?.token || user?.accessToken || user?.jwt || '';
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Could not read saved PulseUp user:', error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function saveStoredUser(user) {
  if (!user || typeof user !== 'object') return null;

  const storedUser = {
    ...user,
    token: getToken(user),
    role: normalizeRole(user.role),
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
  return storedUser;
}

export function getDashboardPath(role) {
  switch (normalizeRole(role)) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'STAFF':
      return '/staff/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

export function clearSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  MIGRATION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
