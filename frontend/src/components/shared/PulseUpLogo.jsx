import { Link } from 'react-router-dom';

import '../../styles/components/shared/PulseUpLogo.css';

function PulseUpLogo({ className = '', href, light = false, onClick, to }) {
  const classes = [
    'pulseup-logo',
    light ? 'pulseup-logo--light' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <img
      className="pulseup-logo__image"
      src="/images/pulseup-logo.webp"
      width="960"
      height="313"
      alt=""
      decoding="async"
      draggable="false"
    />
  );

  if (to) {
    return <Link className={classes} to={to} aria-label="PulseUp home" onClick={onClick}>{content}</Link>;
  }

  return <a className={classes} href={href || '#home'} aria-label="PulseUp home" onClick={onClick}>{content}</a>;
}

export default PulseUpLogo;
