import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { QueryTone, StatusBannerProps } from '../types/index';

const STATUS_COPY: Record<
  QueryTone,
  {
    label: string;
    toneClass: string;
    icon: typeof Info;
  }
> = {
  info: {
    label: 'Informacion',
    toneClass: 'tone-info',
    icon: Info,
  },
  success: {
    label: 'Exito',
    toneClass: 'tone-success',
    icon: CheckCircle2,
  },
  warning: {
    label: 'Aviso',
    toneClass: 'tone-warning',
    icon: AlertTriangle,
  },
  error: {
    label: 'Error',
    toneClass: 'tone-error',
    icon: AlertCircle,
  },
};

export function StatusBanner({ status, compact = false }: StatusBannerProps) {
  const tone = STATUS_COPY[status.tone] || STATUS_COPY.info;
  const Icon = tone.icon;

  return (
    <section
      className={`status-banner ${compact ? 'status-banner-compact' : ''} ${tone.toneClass}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${
          compact
            ? 'status-banner-compact-layout'
            : 'flex flex-col gap-3 md:flex-row md:items-start md:justify-between'
        }`}
      >
        <div className="min-w-0">
          <p className="status-banner-label status-banner-head">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tone.label}
          </p>
          <p className={`status-banner-message ${compact ? 'status-banner-message-compact' : ''}`}>
            {status.message}
          </p>
        </div>

        <span
          className={`meta-chip self-start bg-white/25 text-current ${
            compact ? 'status-banner-code-compact' : ''
          }`}
        >
          {status.code}
        </span>
      </div>
    </section>
  );
}
