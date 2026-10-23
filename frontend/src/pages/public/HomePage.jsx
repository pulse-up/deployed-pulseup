import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import heroImg from '../../assets/hero-students.png';
import comfortImg from '../../assets/comfort-student.webp';
import PulseUpLogo from '../../components/shared/PulseUpLogo';
import '../../styles/pages/public/HomePage.css';

const values = [
  { icon: 'briefcase', title: 'Professional', text: 'Medical practitioners dedicated to the highest standards of clinical excellence.' },
  { icon: 'shield', title: 'Trustworthy', text: 'Building lasting relationships through honesty and reliable health information.' },
  { icon: 'lock', title: 'Confidential', text: 'Your health data is protected by rigorous security and privacy protocols.' },
  { icon: 'eyeoff', title: 'Discreet', text: 'Private consultations designed to make you feel comfortable and respected.' },
  { icon: 'leaf', title: 'Holistic', text: 'Treating the whole person—mind and body—not just the symptoms.' },
  { icon: 'globe', title: 'Culturally Aware', text: 'Responsive care that respects the diverse backgrounds of our community.' },
];

const services = [
  { icon: 'stethoscope', title: 'General Consultations', text: 'Daily check-ups and medical advice.' },
  { icon: 'heart', title: 'Reproductive Health', text: 'Contraception and family planning.' },
  { icon: 'flask', title: 'HIV VCT', text: 'Confidential testing and counseling.' },
  { icon: 'pill', title: 'TB-DOTS', text: 'Treatment support and monitoring.' },
  { icon: 'bandage', title: 'Wound Dressings', text: 'Minor injury care and recovery.' },
];

const ICONS = {
  stethoscope: 'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3M18 10a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  heart: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z',
  eyeoff: 'M9.9 9.9a3 3 0 1 0 4.2 4.2M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3',
  briefcase: 'M12 11v4M14 13h-4M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M18 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z',
  shield: 'M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4',
  flask: 'M14.5 2v6.5L20 19a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 19l5.5-10.5V2M8.5 2h7M7 16h10',
  pill: 'M10.5 20.5l10-10a5 5 0 1 0-7-7l-10 10a5 5 0 1 0 7 7zM8.5 8.5l7 7',
  bandage: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM18 6v12M6 6v12M10 10h.01M10 14h.01M14 10h.01M14 14h.01',
  activity: 'M22 12h-2.5a2 2 0 0 0-1.9 1.5l-2.4 8.4a.25.25 0 0 1-.5 0L9.2 2.2a.25.25 0 0 0-.5 0l-2.3 8.4A2 2 0 0 1 4.5 12H2',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  check: 'M20 6L9 17l-5-5',
  alert: 'M21.7 18l-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3zM12 9v4M12 17h.01',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  close: 'M18 6L6 18M6 6l12 12',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0',
};

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const CAMPUS_CLINICS = [
  {
    name: 'Bellville Campus',
    phone: '+27 21 959 6403',
    tel: '+27219596403',
    location: 'New Library Extension, Ground Floor',
    hours: '08:00 - 16:30',
    image: '/images/bellville-cput.png',
    imageAlt: 'Bellville Campus building with Cape Peninsula University of Technology signage',
  },
  {
    name: 'Cape Town (District Six) Campus',
    phone: '+27 21 460 3405',
    tel: '+27214603405',
    location: 'Administration Building, Level 2, Room 2.900',
    hours: '08:00 - 16:30',
    image: '/images/district-six-cput.png',
    imageAlt: 'District Six Campus main building and landscaped circular drive',
  },
  {
    name: 'Mowbray Campus',
    phone: '+27 21 680 1555',
    tel: '+27216801555',
    location: 'Administration Building, Ground Floor',
    hours: '08:00 - 16:00',
    image: '/images/mowbray-cput.png',
    imageAlt: 'Mowbray Campus grounds with Table Mountain in the background',
  },
  {
    name: 'Wellington Campus',
    phone: '+27 21 864 5522',
    tel: '+27218645522',
    location: 'Administration Building, Ground Floor, Room A29',
    hours: '07:30 - 15:30',
    image: '/images/wellington-cput.png',
    imageAlt: 'Historic white building at Wellington Campus',
  },
];

const PULSY_OPTIONS = [
  {
    id: 'about-pulseup',
    icon: 'activity',
    label: 'What is PulseUp?',
    text: 'PulseUp at a glance:',
    sections: [
      {
        title: 'About the platform',
        items: [
          'Founded in 2026',
          'Digital clinic system-management platform for CPUT students',
          'Saves time through online booking and queue updates',
          'Rewards healthcare awareness with Health Points and food vouchers',
          'Currently piloted at District Six Campus',
          'Planned expansion to Bellville, Mowbray and Wellington',
        ],
      },
      {
        title: 'Our boundaries',
        items: [
          'We are not medical consultants',
          'We do not diagnose medical conditions',
          'We do not prescribe treatment or provide medical advice',
        ],
      },
    ],
    actions: [],
  },
  {
    id: 'services-hours',
    icon: 'clock',
    label: 'Services and clinic hours',
    text: 'Published clinic information:',
    sections: [
      {
        title: 'Services offered',
        items: [
          'General consultations',
          'Reproductive health',
          'Confidential HIV VCT',
          'TB DOTS support',
          'Wound dressings',
        ],
      },
      {
        title: 'Operating hours',
        items: [
          'District Six: 08:00–16:30',
          'Bellville: 08:00–16:30',
          'Mowbray: 08:00–16:00',
          'Wellington: 07:30–15:30',
        ],
      },
    ],
    note: 'Service availability may vary during the District Six pilot rollout.',
    actions: [],
  },
  {
    id: 'student',
    icon: 'user',
    label: "I'm a student",
    text: 'Students can book and manage clinic visits, follow their digital queue, view appointment information, build healthcare awareness and earn Health Points and food-voucher rewards.',
    actions: [
      { label: 'Create student account', to: '/register' },
      { label: 'Student sign in', to: '/login', secondary: true },
    ],
  },
  {
    id: 'clinic-staff',
    icon: 'stethoscope',
    label: "I'm clinic staff",
    text: 'Clinic staff can securely sign in to publish consultation availability, review student appointments, confirm attendance and manage the digital clinic queue.',
    actions: [{ label: 'Clinic staff sign in', to: '/login' }],
  },
  {
    id: 'emergency',
    icon: 'alert',
    label: 'Get emergency help',
    text: 'PulseUp does not provide emergency medical care. For a life-threatening emergency, do not wait for an online appointment; contact campus emergency response immediately.',
    actions: [{ label: 'Call 021 460 3999', href: 'tel:+27214603999' }],
  },
];

const PULSY_SIZE = 52;
const PULSY_EDGE = 12;

function clampPulsyPosition(position) {
  const bottomSafeArea = window.innerWidth <= 760 ? 84 : PULSY_EDGE;

  return {
    x: Math.min(
      Math.max(position.x, PULSY_EDGE),
      Math.max(PULSY_EDGE, window.innerWidth - PULSY_SIZE - PULSY_EDGE),
    ),
    y: Math.min(
      Math.max(position.y, PULSY_EDGE),
      Math.max(
        PULSY_EDGE,
        window.innerHeight - PULSY_SIZE - bottomSafeArea,
      ),
    ),
  };
}

function Pulsy() {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState(() =>
    clampPulsyPosition({
      x: window.innerWidth - PULSY_SIZE - 22,
      y: window.innerHeight - PULSY_SIZE - 22,
    }),
  );
  const dragState = useRef(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    function keepPulsyOnScreen() {
      setPosition((currentPosition) => clampPulsyPosition(currentPosition));
    }

    window.addEventListener('resize', keepPulsyOnScreen);
    return () => window.removeEventListener('resize', keepPulsyOnScreen);
  }, []);

  function handlePointerDown(event) {
    if (event.button !== 0) return;

    dragState.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    const drag = dragState.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;

    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    suppressClick.current = true;
    setDragging(true);
    setPosition(
      clampPulsyPosition({
        x: drag.startX + deltaX,
        y: drag.startY + deltaY,
      }),
    );
  }

  function handlePointerEnd(event) {
    if (dragState.current?.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragState.current = null;
    setDragging(false);
  }

  function handleFabClick(event) {
    if (event.detail !== 0 && suppressClick.current) {
      suppressClick.current = false;
      return;
    }

    setOpen((currentOpen) => !currentOpen);
    setSelectedOption(null);
  }

  function closePanel() {
    setOpen(false);
    setSelectedOption(null);
  }

  const activeOption = PULSY_OPTIONS.find(
    (option) => option.id === selectedOption,
  );
  const panelWidth = Math.min(320, window.innerWidth - PULSY_EDGE * 2);
  const roomAbove = position.y - PULSY_EDGE - 10;
  const roomBelow =
    window.innerHeight - position.y - PULSY_SIZE - PULSY_EDGE - 10;
  const openBelow =
    roomBelow >= Math.min(330, window.innerHeight * 0.45) ||
    roomBelow > roomAbove;
  const panelStyle = {
    position: 'fixed',
    right: 'auto',
    left: Math.min(
      Math.max(
        position.x + PULSY_SIZE / 2 - panelWidth / 2,
        PULSY_EDGE,
      ),
      window.innerWidth - panelWidth - PULSY_EDGE,
    ),
    width: panelWidth,
    maxHeight: Math.max(150, openBelow ? roomBelow : roomAbove),
    ...(openBelow
      ? { top: position.y + PULSY_SIZE + 10, bottom: 'auto' }
      : { top: 'auto', bottom: window.innerHeight - position.y + 10 }),
  };
  const pulsyClassName = [
    'pulsy',
    openBelow ? 'pulsy--open-below' : '',
    dragging ? 'pulsy--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={pulsyClassName}
      style={{ left: position.x, top: position.y }}
    >
      {open && (
        <section
          className="pulsy-panel"
          style={panelStyle}
          aria-label="Pulsy digital platform assistant"
        >
          <header>
            <span className="pulsy-avatar">
              <Icon name="activity" size={18} />
            </span>
            <div>
              <strong>Pulsy</strong>
              <small>PulseUp digital platform assistant</small>
            </div>
            <button type="button" aria-label="Close quick help" onClick={closePanel}>
              <Icon name="close" size={17} />
            </button>
          </header>

          <div className="pulsy-body">
            {activeOption ? (
              <div className="pulsy-detail">
                <button
                  type="button"
                  className="pulsy-back"
                  onClick={() => setSelectedOption(null)}
                >
                  ← All options
                </button>
                <span className="pulsy-detail-icon">
                  <Icon name={activeOption.icon} size={20} />
                </span>
                <h3>{activeOption.label}</h3>
                <p>{activeOption.text}</p>

                {activeOption.sections?.length > 0 && (
                  <div className="pulsy-info-groups">
                    {activeOption.sections.map((section) => (
                      <section className="pulsy-info-group" key={section.title}>
                        <h4>{section.title}</h4>
                        <ul>
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}

                {activeOption.note && (
                  <p className="pulsy-info-note">{activeOption.note}</p>
                )}

                {activeOption.actions.length > 0 && (
                  <div className="pulsy-actions">
                    {activeOption.actions.map((action) =>
                      action.to ? (
                        <Link
                          className={action.secondary ? 'pulsy-action pulsy-action--secondary' : 'pulsy-action'}
                          to={action.to}
                          onClick={closePanel}
                          key={action.label}
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <a
                          className="pulsy-action"
                          href={action.href}
                          onClick={closePanel}
                          key={action.label}
                        >
                          {action.label}
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="pulsy-options">
                {PULSY_OPTIONS.map((option) => (
                  <button
                    type="button"
                    className="pulsy-option"
                    onClick={() => setSelectedOption(option.id)}
                    key={option.id}
                  >
                    <span>
                      <Icon name={option.icon} size={18} />
                    </span>
                    <strong>{option.label}</strong>
                    <b aria-hidden="true">›</b>
                  </button>
                ))}
              </div>
            )}
          </div>

          <small className="pulsy-note">
            Pulsy explains and navigates the digital platform. It does not
            provide consultations, diagnosis, treatment or medical advice.
          </small>
        </section>
      )}

      <span className="pulsy-drag-hint" aria-hidden="true">
        Drag me
      </span>
      <button
        type="button"
        className="pulsy-fab"
        aria-label={open ? 'Close PulseUp quick help' : 'Open PulseUp quick help. This button can also be dragged.'}
        aria-expanded={open}
        onClick={handleFabClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <Icon name={open ? 'close' : 'chat'} size={23} />
      </button>
    </div>
  );
}

function HomePage() {
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clinicGalleryRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let animationFrameId = null;

    function updateNavigation() {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      setHeaderScrolled(currentScrollY > 12);

      if (currentScrollY < 40) {
        setHeaderExpanded(false);
      } else if (scrollDifference > 6) {
        setHeaderExpanded(true);
      } else if (scrollDifference < -6) {
        setHeaderExpanded(false);
      }

      lastScrollY = currentScrollY;
      animationFrameId = null;
    }

    function handleScroll() {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateNavigation);
    }

    const revealTargets = document.querySelectorAll(
      [
        '.home-stat-strip',
        '.home-heading',
        '.home-values',
        '.home-purpose',
        '.home-service-grid',
        '.home-service-action',
        '.home-steps',
        '.home-queue-card',
        '.home-emergency-card',
        '.home-contact-cards',
      ].join(','),
    );

    revealTargets.forEach((element) => {
      element.classList.add('home-reveal');
    });

    let revealObserver = null;

    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -50px 0px',
        },
      );

      revealTargets.forEach((element) => {
        revealObserver.observe(element);
      });
    } else {
      revealTargets.forEach((element) => {
        element.classList.add('is-visible');
      });
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      if (revealObserver) {
        revealObserver.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth > 1000) {
        setMobileMenuOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', handleKeyDown);

      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function scrollClinicGallery(direction) {
    const gallery = clinicGalleryRef.current;

    if (!gallery) return;

    gallery.scrollBy({
      left: direction * Math.max(260, gallery.clientWidth * 0.82),
      behavior: 'smooth',
    });
  }

  const headerClassName = [
    'home-header',
    headerScrolled ? 'home-header-scrolled' : '',
    headerExpanded && !mobileMenuOpen ? 'home-header-expanded' : '',
    mobileMenuOpen ? 'home-header-menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const navigationClassName = [
    'home-links',
    mobileMenuOpen ? 'home-links-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const menuButtonClassName = [
    'home-menu-button',
    mobileMenuOpen ? 'home-menu-button-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="home-page">
      <header className={headerClassName}>
        <nav className="home-container home-nav" aria-label="Main navigation">
          <PulseUpLogo className="home-logo" href="#home" onClick={closeMobileMenu} />

          <div id="home-navigation-menu" className={navigationClassName}>
            <span className="home-menu-label">Explore PulseUp</span>

            <a href="#home" onClick={closeMobileMenu}>
              Home
            </a>

            <a href="#about" onClick={closeMobileMenu}>
              About us
            </a>

            <a href="#contact" onClick={closeMobileMenu}>
              Contact
            </a>

            <a href="#services" onClick={closeMobileMenu}>
              Services
            </a>

            <div className="home-mobile-actions">
              <Link
                className="home-button home-button-outline"
                to="/login"
                onClick={closeMobileMenu}
              >
                Student sign in
              </Link>

              <Link
                className="home-button"
                to="/register"
                onClick={closeMobileMenu}
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="home-nav-actions">
            <Link className="home-login-link" to="/login">
              Sign in
            </Link>

            <Link className="home-button home-button-small" to="/register">
              Create account
            </Link>
          </div>

          <button
            className={menuButtonClassName}
            type="button"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="home-navigation-menu"
            onClick={() => {
              setMobileMenuOpen((currentState) => !currentState);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      <main>
        <section className="bmc-hero" id="home">
          <div className="bmc-hero-media">
            <img src={heroImg} alt="A clinician in scrubs and a face shield" />

            <div className="bmc-hero-scrim" />
          </div>

          <div className="home-container bmc-hero-content">
            <h1>Campus healthcare, without the morning queue.</h1>

            <p>
              PulseUp connects CPUT students with the campus clinical team for
              simple booking, live queue updates and confidential support.
            </p>

            <div className="bmc-hero-actions">
              <Link className="bmc-button bmc-button-solid" to="/register">
                Book a clinic visit
              </Link>

              <Link className="bmc-button bmc-button-outline" to="/login">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="bmc-intro">
          <div className="home-container bmc-intro-inner">
            <span className="bmc-intro-label">Rewriting campus healthcare</span>

            <h2>Student healthcare that fits your timetable.</h2>

            <p>
              PulseUp helps CPUT students move from booking to campus care with
              clearer appointment information and less time spent in queues.
            </p>
          </div>
        </section>

        <section className="bmc-feature">
          <div className="home-container bmc-feature-grid">
            <div className="bmc-feature-media">
              <img
                src={comfortImg}
                alt="A student booking a clinic appointment on her phone from her room"
              />
            </div>

            <div className="bmc-feature-copy">
              <span className="bmc-feature-label">Clinic booking</span>

              <h3>Book from the comfort of your room.</h3>

              <p>
                No more waiting in early morning queues outside the clinic.
                Whether you're in your residence or a lecture hall, secure
                your appointment with just a few taps.
              </p>

              <div className="bmc-feature-actions">
                <Link className="bmc-button bmc-button-solid" to="/register">
                  Book an appointment
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-about" id="about">
          <div className="home-container">
            <div className="home-heading home-heading-centred home-heading-light">
              <h2>About Us</h2>
              <p>The principles that guide every interaction at PulseUp.</p>
            </div>
            <div className="home-values">
              {values.map((item) => (
                <article key={item.title}>
                  <span className="home-value-icon"><Icon name={item.icon} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-vm">
          <div className="home-container home-purpose">
            <article>
              <span className="home-purpose-number"><Icon name="eye" size={32} /></span>
              <div>
                <h3>Our Vision</h3>
                <p>To be the leading university clinical service in South Africa, recognized for our commitment to student well-being and clinical precision through integrated campus healthcare.</p>
              </div>
            </article>
            <article>
              <span className="home-purpose-number"><Icon name="target" size={32} /></span>
              <div>
                <h3>Our Mission</h3>
                <p>Providing accessible, affordable, and holistic primary health care services that empower the CPUT community to excel in their academic and professional journeys.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="home-section home-services" id="services">
          <div className="home-container">
            <div className="home-services-top">
              <div className="home-heading home-heading-light">
                <h2>Services for Students</h2>
                <p>Comprehensive health support tailored for the academic lifestyle.</p>
              </div>
              <div className="home-free"><strong>100% Free</strong><span>For registered students</span></div>
            </div>
            <div className="home-service-grid">
              {services.map((service) => (
                <article key={service.title}>
                  <span className="home-service-icon"><Icon name={service.icon} /></span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-clinics-section" id="contact">
          <div className="home-help-contact">
            <div className="home-help-contact-head">
              <span>Campus clinics</span>
              <h2>Reach a campus clinic directly.</h2>
              <p>
                Find the clinic closest to you, check its consultation hours
                and call the campus team directly.
              </p>
            </div>

            <div className="home-clinic-carousel-controls" aria-label="Campus gallery controls">
              <button
                type="button"
                aria-label="Show previous campus clinics"
                onClick={() => scrollClinicGallery(-1)}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                aria-label="Show next campus clinics"
                onClick={() => scrollClinicGallery(1)}
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div
              ref={clinicGalleryRef}
              className="home-help-clinics"
              role="region"
              aria-label="CPUT campus clinic gallery"
              tabIndex="0"
            >
              {CAMPUS_CLINICS.map((campus) => (
                <article key={campus.name}>
                  <div className="home-clinic-media">
                    <img
                      src={campus.image}
                      alt={campus.imageAlt}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="home-clinic-content">
                    <h3>{campus.name}</h3>

                    <p className="home-help-row">
                      <Icon name="pin" size={17} />
                      <span>{campus.location}</span>
                    </p>

                    <p className="home-help-row">
                      <Icon name="clock" size={17} />
                      <span>Consultation hours: {campus.hours}</span>
                    </p>

                    <a className="home-help-call" href={`tel:${campus.tel}`}>
                      <Icon name="phone" size={16} />
                      {campus.phone}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="home-emergency-section"
          aria-labelledby="home-emergency-title"
        >
          <div className="home-container">
            <div className="home-help-emergency">
              <div className="home-help-copy">
                <span className="home-help-eyebrow">
                  <Icon name="alert" size={16} />
                  Critical emergencies
                </span>

                <h2 id="home-emergency-title">
                  No appointment needed in an emergency.
                </h2>

                <p>
                  Visit us immediately or call the emergency line if you or
                  someone else has:
                </p>

                <ul className="home-emergency-pills">
                  <li>Severe Bleeding</li>
                  <li>Unconscious</li>
                  <li>Severe Asthma</li>
                  <li>Allergic Reaction</li>
                  <li>Difficulty Moving / Trauma</li>
                </ul>
              </div>

              <div className="home-call-card">
                <h3>Emergency Response</h3>
                <p>24/7 Dispatch and On-Campus Medical Support</p>
                <a className="num" href="tel:+27214603999">021 460 3999</a>
                <small>District Six Campus</small>
                <a className="home-button" href="tel:+27214603999">
                  <Icon name="phone" size={18} />
                  Call Immediately
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer-grid">
          <div>
            <PulseUpLogo className="home-logo" href="#home" light />

            <p>
              Student-focused appointment booking and digital queue information
              for CPUT campus healthcare.
            </p>
          </div>

          <div className="home-footer-links">
            <strong>Explore</strong>
            <a href="#about">About us</a>
            <a href="#services">Student services</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="home-footer-links">
            <strong>Student access</strong>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </div>

          <div className="home-footer-alert">
            <strong>Need urgent help?</strong>

            <p>
              Online booking is not intended for life-threatening emergencies.
            </p>
          </div>
        </div>

        <div className="home-container home-footer-bottom">
          <span>© 2026 PulseUp. Student project.</span>

          <a
            href="https://www.cput.ac.za/student/support-services/dsa/campus-health-clinics"
            target="_blank"
            rel="noreferrer"
          >
            Official CPUT Campus Health information
          </a>
        </div>
      </footer>

      <nav className="home-mobile-bottom-nav" aria-label="Mobile quick navigation">
        <a href="#home">
          <Icon name="home" size={19} />
          <span>Home</span>
        </a>
        <a href="#services">
          <Icon name="heart" size={19} />
          <span>Services</span>
        </a>
        <a href="#contact">
          <Icon name="pin" size={19} />
          <span>Clinics</span>
        </a>
        <Link to="/login">
          <Icon name="user" size={19} />
          <span>Sign in</span>
        </Link>
      </nav>

      <Pulsy />
    </div>
  );
}

export default HomePage;
