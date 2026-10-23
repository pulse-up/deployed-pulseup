import { useEffect, useId, useMemo, useRef, useState } from 'react';

import '../../styles/components/shared/NotificationCenter.css';

function readStoredIds(storageKey) {
  if (!storageKey) return [];
  try {
    const value = JSON.parse(localStorage.getItem(`pulseup.notifications.${storageKey}`) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function NotificationCenter({ notifications = [], onSelect, storageKey }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => readStoredIds(storageKey));
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const generatedId = useId().replace(/:/g, '');
  const panelId = `pulse-notifications-${generatedId}`;
  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = notifications.filter((item) => !readSet.has(item.id)).length;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function persist(nextIds) {
    const trimmed = nextIds.slice(-100);
    setReadIds(trimmed);
    if (storageKey) {
      localStorage.setItem(`pulseup.notifications.${storageKey}`, JSON.stringify(trimmed));
    }
  }

  function markRead(notification) {
    if (!readSet.has(notification.id)) persist([...readIds, notification.id]);
    setOpen(false);
    onSelect?.(notification);
  }

  function markAllRead() {
    persist([...new Set([...readIds, ...notifications.map((item) => item.id)])]);
  }

  return (
    <div className="notification-center" ref={rootRef}>
      <span className="notification-center__live" aria-live="polite">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="notification-center__trigger"
        aria-label={`PulseUp notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        </svg>
        {unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section id={panelId} className="notification-center__panel" aria-label="PulseUp notifications">
          <header>
            <div><strong>PulseUp notifications</strong><small>{unreadCount} unread</small></div>
            {unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all read</button>}
          </header>
          {notifications.length === 0 ? (
            <p className="notification-center__empty">You are all caught up.</p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={readSet.has(notification.id) ? 'is-read' : ''}
                    onClick={() => markRead(notification)}
                  >
                    <i aria-hidden="true" />
                    <span>
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{notification.meta}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationCenter;
