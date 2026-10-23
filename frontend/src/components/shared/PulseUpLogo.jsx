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
    <>
      <span className="pulseup-logo__pulse">PULSE</span>
      <span className="pulseup-logo__up">UP</span>
    </>
  );

  if (to) {
    return <Link className={classes} to={to} aria-label="PulseUp home" onClick={onClick}>{content}</Link>;
  }

  return <a className={classes} href={href || '#home'} aria-label="PulseUp home" onClick={onClick}>{content}</a>;
}

export default PulseUpLogo;
