import { useEffect, useState } from 'react';

import api from '../../lib/api/api';
import '../../styles/components/student/HealthRewards.css';

const DEFAULT_POINTS_PER_VISIT = 10;
const DEFAULT_TARGET = 60;

function formatVoucherDate(value) {
  if (!value) return 'Not available';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

function HealthRewards({ healthPoints = 0 }) {
  const [voucherProgress, setVoucherProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .get('/vouchers/me/progress')
      .then((response) => {
        if (!cancelled) setVoucherProgress(response.data || null);
      })
      .catch((error) => {
        console.error('Voucher progress loading failed:', error);
        if (!cancelled) {
          setErrorMessage(
            'Voucher details are temporarily unavailable. Your Health Points balance is still shown.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const points = Math.max(
    0,
    Number(voucherProgress?.healthPoints ?? healthPoints) || 0,
  );
  const pointsPerVisit =
    Number(voucherProgress?.pointsPerCompletedVisit) || DEFAULT_POINTS_PER_VISIT;
  const target =
    Number(
      voucherProgress?.nextTierAmount ??
        voucherProgress?.maximumTierAmount ??
        DEFAULT_TARGET,
    ) || DEFAULT_TARGET;
  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(voucherProgress?.progressPercentage) ||
        Math.round((points / target) * 100),
    ),
  );
  const remainingPoints = Math.max(
    Number(voucherProgress?.pointsToNextTier ?? target - points) || 0,
    0,
  );
  const completedVisits = Math.floor(points / pointsPerVisit);
  const activeVoucher = voucherProgress?.activeVoucher || null;
  const vouchers = Array.isArray(voucherProgress?.vouchers)
    ? voucherProgress.vouchers
    : [];
  const rewardAmount =
    activeVoucher?.amount ||
    voucherProgress?.nextTierAmount ||
    voucherProgress?.currentTierAmount ||
    DEFAULT_TARGET;
  const voucherUnlocked = Boolean(activeVoucher);

  return (
    <section className="modern-rewards">
      <header className="modern-rewards__header">
        <div>
          <p className="modern-rewards__eyebrow">HEALTH REWARDS</p>
          <h2>Food voucher progress</h2>
          <p className="modern-rewards__description">
            Completed clinic visits create Health Point transactions.
          </p>
        </div>

        <article className="modern-rewards__balance">
          <span>Current balance</span>
          <strong>{points}</strong>
          <small>Health Points</small>
        </article>
      </header>

      {errorMessage && (
        <p className="modern-rewards__message" role="status">
          {errorMessage}
        </p>
      )}

      <article className="modern-voucher">
        <div className="modern-voucher__media">
          <img
            src="/images/cyngatha-team.png"
            alt="Cyngatha team supporting the PulseUp student reward programme"
          />
        </div>

        <div className="modern-voucher__content">
          <header className="modern-voucher__header">
            <div>
              <p>{activeVoucher ? 'ACTIVE VOUCHER' : 'NEXT REWARD TIER'}</p>
              <h3>R{rewardAmount} Food Voucher</h3>
            </div>
            <span
              className={
                voucherUnlocked
                  ? 'modern-voucher__status is-unlocked'
                  : 'modern-voucher__status'
              }
            >
              {loading
                ? 'Loading'
                : voucherUnlocked
                  ? activeVoucher.status
                  : 'Quest active'}
            </span>
          </header>

          <div className="modern-voucher__progress-heading">
            <span>Your progress</span>
            <strong>
              {points} / {target} points
            </strong>
          </div>

          <div
            className="modern-voucher__progress"
            role="progressbar"
            aria-label="Food voucher progress"
            aria-valuemin="0"
            aria-valuemax={target}
            aria-valuenow={Math.min(points, target)}
          >
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="modern-voucher__progress-footer">
            <span>0 points</span>
            <strong>{progress}% complete</strong>
            <span>{target} points</span>
          </div>

          <div className="modern-voucher__metrics">
            <article>
              <span>Completed visits</span>
              <strong>{completedVisits}</strong>
            </article>
            <article>
              <span>Points remaining</span>
              <strong>{remainingPoints}</strong>
            </article>
          </div>

          {activeVoucher && (
            <div className="modern-voucher__code">
              <span>VOUCHER CODE</span>
              <strong>{activeVoucher.voucherCode}</strong>
              <small>
                Issued {formatVoucherDate(activeVoucher.issuedAt)} · Expires{' '}
                {formatVoucherDate(activeVoucher.expiresAt)}
              </small>
            </div>
          )}

          <div
            className={
              voucherUnlocked
                ? 'modern-voucher__notice is-success'
                : 'modern-voucher__notice'
            }
          >
            <span aria-hidden="true">{voucherUnlocked ? '✓' : '+'}</span>
            <p>
              {voucherProgress?.progressMessage ||
                (voucherUnlocked
                  ? `Your R${rewardAmount} voucher is active.`
                  : `Earn ${remainingPoints} more Health Points to unlock the next voucher.`)}
            </p>
          </div>
        </div>
      </article>

      {vouchers.length > 0 && (
        <section className="modern-voucher-history" aria-label="Voucher history">
          <h3>Issued vouchers</h3>
          <div>
            {vouchers.map((voucher) => (
              <article key={voucher.voucherId}>
                <span>R{voucher.amount}</span>
                <strong>{voucher.voucherCode}</strong>
                <small>
                  {voucher.status} · expires {formatVoucherDate(voucher.expiresAt)}
                </small>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="modern-rewards__steps">
        <article>
          <span>01</span>
          <div>
            <strong>Book a clinic visit</strong>
            <p>Select an available campus healthcare time slot.</p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <strong>Complete your visit</strong>
            <p>Attend the consultation with the assigned clinician.</p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <strong>Receive Health Points</strong>
            <p>Your balance and eligible vouchers update automatically.</p>
          </div>
        </article>
      </section>
    </section>
  );
}

export default HealthRewards;
