import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import PulseUpLogo from './PulseUpLogo';
import NotificationCenter from './NotificationCenter';
import '../../styles/components/shared/ResponsiveHeader.css';

function MobileNavIcon({ label }) {
  const normalizedLabel = label.toLowerCase();
  let path = 'M4 6h16M4 12h16M4 18h16';

  if (normalizedLabel === 'home') {
    path = 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6';
  } else if (normalizedLabel.includes('history')) {
    path = 'M4 6h16M4 10h16M6 10v10h12V10M9 14h6M9 17h4';
  } else if (normalizedLabel.includes('sick note')) {
    path = 'M9 3h6v4h4v14H5V7h4V3zM9 13h6M12 10v6';
  } else if (
    normalizedLabel.includes('appointment') ||
    normalizedLabel.includes('pending') ||
    normalizedLabel.includes('booking')
  ) {
    path = 'M6 3v3M18 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1zM8 12h3M8 16h5';
  } else if (
    normalizedLabel.includes('reward') ||
    normalizedLabel.includes('confirmed')
  ) {
    path = 'M12 3 9.5 8 4 8.8l4 4-.9 5.7 4.9-2.7 4.9 2.7-.9-5.7 4-4-5.5-.8L12 3z';
  } else if (
    normalizedLabel.includes('profile') ||
    normalizedLabel.includes('user')
  ) {
    path = 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0';
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function ResponsiveHeader({
  ariaLabel = 'Page navigation',
  desktopAction,
  desktopActions,
  desktopSignOut = true,
  identity,
  menuItems = [],
  notificationKey,
  notifications = [],
  onNotificationSelect,
  onSignOut,
  showLogo = true,
  subtitle,
  title,
  variant = 'dashboard',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const actions = desktopActions || (desktopAction ? [desktopAction] : []);
  const generatedId = useId().replace(/:/g, '');
  const menuId = `pulse-responsive-menu-${generatedId}`;
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const mobileItems = menuItems.slice(0, 3);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    function closeAndRestoreFocus() {
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') closeAndRestoreFocus();
    }

    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false);
    }

    function handleResize() {
      if (window.innerWidth > 980) setMenuOpen(false);
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleMenuAction(onSelect) {
    closeMenu();
    onSelect?.();
  }

  function renderMenuItem(item, mobile = false) {
    const className = mobile
      ? `pulse-mobile-nav__item${item.active ? ' is-active' : ''}`
      : `pulse-responsive-header__menu-item${item.active ? ' is-active' : ''}`;
    const content = mobile ? (
      <>
        <MobileNavIcon label={item.label} />
        <span>{item.label}</span>
      </>
    ) : (
      item.label
    );

    if (item.to) {
      return (
        <Link
          className={className}
          to={item.to}
          aria-current={item.active ? 'page' : undefined}
          onClick={closeMenu}
          key={`${mobile ? 'bottom' : 'menu'}-${item.label}-${item.to}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={className}
        aria-pressed={item.active || undefined}
        onClick={() => handleMenuAction(item.onSelect)}
        key={`${mobile ? 'bottom' : 'menu'}-${item.label}`}
      >
        {content}
      </button>
    );
  }

  const headerClassName = [
    'pulse-responsive-header',
    `pulse-responsive-header--${variant}`,
    !showLogo ? 'pulse-responsive-header--no-logo' : '',
    notificationKey ? 'pulse-responsive-header--has-notifications' : '',
    menuOpen ? 'pulse-responsive-header--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName} ref={headerRef}>
      <div className="pulse-responsive-header__inner">
        {showLogo && (
          <PulseUpLogo
            className="pulse-responsive-header__logo"
            to="/"
            light={variant === 'auth'}
            onClick={closeMenu}
          />
        )}

        {title && (
          <div className="pulse-responsive-header__page-title">
            <strong>{title}</strong>
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}

        <div className="pulse-responsive-header__desktop">
          {identity && (
            <div className="pulse-responsive-header__identity-wrap">
              <span className="pulse-responsive-header__avatar" aria-hidden="true">
                {identity.imageUrl ? (
                  <img src={identity.imageUrl} alt="" />
                ) : (
                  (identity.name || 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join('')
                )}
              </span>
              <div className="pulse-responsive-header__identity">
                <strong>{identity.name}</strong>
                <span>{identity.detail}</span>
              </div>
            </div>
          )}

          {actions.map((action) => (
            <Link
              className="pulse-responsive-header__desktop-link"
              to={action.to}
              key={`${action.label}-${action.to}`}
            >
              {action.label}
            </Link>
          ))}

          {onSignOut && desktopSignOut && (
            <button
              type="button"
              className="pulse-responsive-header__sign-out"
              onClick={onSignOut}
            >
              Sign out
            </button>
          )}
        </div>

        {notificationKey && (
          <NotificationCenter
            notifications={notifications}
            onSelect={onNotificationSelect}
            storageKey={notificationKey}
          />
        )}

        <button
          ref={menuButtonRef}
          className="pulse-responsive-header__menu-button"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((currentState) => !currentState)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id={menuId}
          className="pulse-responsive-header__menu"
          aria-label={ariaLabel}
          hidden={!menuOpen}
        >
          <p className="pulse-responsive-header__menu-label">PulseUp menu</p>

          {identity && (
            <div className="pulse-responsive-header__mobile-identity">
              <strong>{identity.name}</strong>
              <span>{identity.detail}</span>
            </div>
          )}

          <div className="pulse-responsive-header__menu-items">
            {menuItems.map((item) => renderMenuItem(item))}

            {onSignOut && (
              <button
                type="button"
                className="pulse-responsive-header__menu-item pulse-responsive-header__menu-item--sign-out"
                onClick={() => handleMenuAction(onSignOut)}
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      </div>

      {variant === 'dashboard' && mobileItems.length > 0 && (
        <nav className="pulse-mobile-nav" aria-label="Dashboard quick navigation">
          {mobileItems.map((item) => renderMenuItem(item, true))}
          <button
            type="button"
            className={`pulse-mobile-nav__item${menuOpen ? ' is-active' : ''}`}
            aria-label="View all dashboard options"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((currentState) => !currentState)}
          >
            <MobileNavIcon label="Menu" />
            <span>More</span>
          </button>
        </nav>
      )}
    </header>
  );
}

export default ResponsiveHeader;
