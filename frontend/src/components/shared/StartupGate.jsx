import { useEffect, useState } from 'react';

import { checkApiHealth } from '../../lib/api/api';
import '../../styles/components/shared/StartupGate.css';

const RETRY_DELAYS_MS = [1200, 2000, 3000, 5000, 8000, 10000];
const LONG_WAIT_MS = 45000;
const MINIMUM_SPLASH_MS = 1100;

function getAttemptMessage(attempt, isLongWait) {
  if (isLongWait) return 'The service is taking longer than expected';
  if (attempt === 1) return 'Connecting to the service';
  if (attempt === 2) return 'Waking the service';
  if (attempt === 3) return 'Connecting to the database';
  return 'Preparing the secure connection';
}

function StartupGate({ children }) {
  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState('checking');
  const [progress, setProgress] = useState(10);
  const [message, setMessage] = useState('Connecting to the service');
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
      const waitingLonger = Date.now() - startedAt >= LONG_WAIT_MS;

      setIsLongWait(waitingLonger);
      setMessage(getAttemptMessage(attempt, waitingLonger));
      requestController = new AbortController();

      try {
        const isHealthy = await checkApiHealth({
          signal: requestController.signal,
        });

        if (!active) return;

        if (isHealthy) {
          window.clearInterval(progressTimer);
          setProgress(100);
          setMessage('Connection ready');
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
        setMessage('The service is taking longer than expected');
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
    setMessage('Connecting to the service');
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

      <section className="startup-gate__content" aria-label="Website startup progress">
        <div className="startup-gate__spinner" aria-hidden="true">
          <span className="startup-gate__ring startup-gate__ring--outer"><i /></span>
          <span className="startup-gate__ring startup-gate__ring--middle"><i /></span>
          <span className="startup-gate__ring startup-gate__ring--inner" />
          <span className="startup-gate__core" />
        </div>

        <div className="startup-gate__percentage" aria-hidden="true">
          <strong>{roundedProgress}</strong><span>%</span>
        </div>

        <div
          className="startup-gate__progress"
          role="progressbar"
          aria-label="Service startup progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={roundedProgress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="startup-gate__sr-status" role="status" aria-live="polite">
          {message}
        </p>

        {isLongWait && phase !== 'ready' ? (
          <button
            type="button"
            className="startup-gate__retry"
            onClick={restartCheck}
          >
            Check again
          </button>
        ) : null}
      </section>
    </main>
  );
}

export default StartupGate;
