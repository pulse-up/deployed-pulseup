import { useEffect, useState } from 'react';

import { checkApiHealth } from '../../lib/api/api';
import '../../styles/components/shared/StartupGate.css';

const RETRY_DELAYS_MS = [1200, 2000, 3000, 5000, 8000, 10000];
const LONG_WAIT_MS = 45000;
const MINIMUM_SPLASH_MS = 1100;

function getAttemptMessage(attempt, isLongWait) {
  if (isLongWait) return 'The clinic service is taking longer than expected';
  if (attempt === 1) return 'Contacting the secure clinic service';
  if (attempt === 2) return 'Waking PulseUp services';
  if (attempt === 3) return 'Connecting to the clinic database';
  return 'Preparing your secure connection';
}

function StartupGate({ children }) {
  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState('checking');
  const [progress, setProgress] = useState(10);
  const [message, setMessage] = useState('Contacting the secure clinic service');
  const [detail, setDetail] = useState('This usually takes only a moment.');
  const [isLongWait, setIsLongWait] = useState(false);

  useEffect(() => {
    let active = true;
    let attempt = 0;
    let retryTimer;
    let readyTimer;
    let requestController;
    const startedAt = Date.now();

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const target = Math.min(
        93,
        10 + 83 * (1 - Math.exp(-elapsed / 18000)),
      );

      setProgress((current) => Math.max(current, target));
    }, 350);

    const checkReadiness = async () => {
      if (!active) return;

      attempt += 1;
      const elapsed = Date.now() - startedAt;
      const waitingLonger = elapsed >= LONG_WAIT_MS;

      setIsLongWait(waitingLonger);
      setMessage(getAttemptMessage(attempt, waitingLonger));
      setDetail(
        waitingLonger
          ? 'The service may still be waking from rest. We are checking automatically.'
          : 'Checking the application and clinic database before you continue.',
      );

      requestController = new AbortController();

      try {
        const isHealthy = await checkApiHealth({
          signal: requestController.signal,
        });

        if (!active) return;

        if (isHealthy) {
          window.clearInterval(progressTimer);
          setProgress(100);
          setMessage('PulseUp is ready');
          setDetail('Opening your clinic experience securely.');
          setPhase('ready');

          const remainingSplashTime = Math.max(
            550,
            MINIMUM_SPLASH_MS - (Date.now() - startedAt),
          );

          readyTimer = window.setTimeout(() => {
            if (active) setPhase('complete');
          }, remainingSplashTime);
          return;
        }
      } catch (error) {
        if (!active || error?.code === 'ERR_CANCELED') return;
      }

      if (!active) return;

      const totalWait = Date.now() - startedAt;
      if (totalWait >= LONG_WAIT_MS) {
        setIsLongWait(true);
        setMessage('The clinic service is taking longer than expected');
        setDetail(
          'The service may still be waking from rest. We are checking automatically.',
        );
      }

      const delay = RETRY_DELAYS_MS[
        Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)
      ];
      retryTimer = window.setTimeout(checkReadiness, delay);
    };

    checkReadiness();

    return () => {
      active = false;
      requestController?.abort();
      window.clearInterval(progressTimer);
      window.clearTimeout(retryTimer);
      window.clearTimeout(readyTimer);
    };
  }, [runKey]);

  const restartCheck = () => {
    setPhase('checking');
    setProgress(10);
    setMessage('Contacting the secure clinic service');
    setDetail('This usually takes only a moment.');
    setIsLongWait(false);
    setRunKey((current) => current + 1);
  };

  if (phase === 'complete') return children;

  const roundedProgress = Math.round(progress);

  return (
    <main className={`startup-gate startup-gate--${phase}`}>
      <div className="startup-gate__aurora startup-gate__aurora--one" />
      <div className="startup-gate__aurora startup-gate__aurora--two" />
      <div className="startup-gate__grid" />

      <section className="startup-gate__content" aria-labelledby="startup-title">
        <div className="startup-gate__visual" aria-hidden="true">
          <span className="startup-gate__orbit startup-gate__orbit--outer">
            <i />
          </span>
          <span className="startup-gate__orbit startup-gate__orbit--inner">
            <i />
          </span>
          <span className="startup-gate__pulse startup-gate__pulse--one" />
          <span className="startup-gate__pulse startup-gate__pulse--two" />
          <span className="startup-gate__mark-shell">
            <img src="/favicon.svg" alt="" className="startup-gate__mark" />
          </span>
          <svg className="startup-gate__heartbeat" viewBox="0 0 220 42">
            <path d="M2 23h56l9-13 13 27 14-32 14 18h110" />
          </svg>
        </div>

        <div className="startup-gate__wordmark" aria-label="PulseUp">
          <span>PULSE</span><strong>UP</strong>
        </div>
        <p className="startup-gate__eyebrow">CPUT Campus Clinic</p>
        <h1 id="startup-title">{message}</h1>
        <p className="startup-gate__detail">{detail}</p>

        <div
          className="startup-gate__progress"
          role="progressbar"
          aria-label="PulseUp service startup progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={roundedProgress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="startup-gate__status" aria-hidden="true">
          <span className="startup-gate__status-dot" />
          <span>{phase === 'ready' ? 'Connected' : `${roundedProgress}% ready`}</span>
        </div>
        <p className="startup-gate__sr-status" role="status" aria-live="polite">
          {phase === 'ready' ? 'PulseUp is connected and ready.' : message}
        </p>

        {isLongWait && phase !== 'ready' ? (
          <button
            type="button"
            className="startup-gate__retry"
            onClick={restartCheck}
          >
            Check again now
          </button>
        ) : null}
      </section>

      <p className="startup-gate__security">
        <span aria-hidden="true">✦</span> Secure health services connection
      </p>
    </main>
  );
}

export default StartupGate;
