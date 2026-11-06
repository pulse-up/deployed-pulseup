import { useEffect, useState } from 'react';

import { checkApiHealth } from '../../lib/api/api';
import '../../styles/components/shared/StartupGate.css';

const RETRY_DELAYS_MS = [1200, 2000, 3000, 5000, 8000, 10000];
const LONG_WAIT_MS = 45000;
const READY_VISIBLE_MS = 1800;

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

          readyTimer = window.setTimeout(() => {
            if (active) setPhase('complete');
          }, READY_VISIBLE_MS);
          return;
        }
      } catch (error) {
        if (!active || error?.code === 'ERR_CANCELED') return;
      }

      if (!active) return;

      if (Date.now() - startedAt >= LONG_WAIT_MS) {
        setIsLongWait(true);
        setMessage('The service is taking longer than expected');
      }

      const delay = RETRY_DELAYS_MS[
        Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)
      ];
      retryTimer = window.setTimeout(checkReadiness, delay);
    };

    void checkReadiness();

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

  const roundedProgress = Math.round(progress);

  return (
    <>
      {children}

      {phase !== 'complete' ? (
        <aside
          className={`service-readiness service-readiness--${phase}`}
          aria-label="Background service startup progress"
        >
          <div className="service-readiness__card">
            <span className="service-readiness__spinner" aria-hidden="true" />

            <div
              className="service-readiness__progress"
              role="progressbar"
              aria-label="Background service startup progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={roundedProgress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>

            <strong className="service-readiness__percentage" aria-hidden="true">
              {roundedProgress}%
            </strong>

            <p className="service-readiness__sr-status" role="status" aria-live="polite">
              {message}
            </p>

            {isLongWait && phase !== 'ready' ? (
              <button
                type="button"
                className="service-readiness__retry"
                onClick={restartCheck}
              >
                Check again
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}

export default StartupGate;
