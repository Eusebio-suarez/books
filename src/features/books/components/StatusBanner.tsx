import type { QueryTone, StatusBannerProps } from '../types/index';

const STATUS_COPY: Record<QueryTone, { label: string; toneClass: string }> = {
  info: {
    label: 'Informacion',
    toneClass: 'tone-info',
  },
  success: {
    label: 'Exito',
    toneClass: 'tone-success',
  },
  warning: {
    label: 'Aviso',
    toneClass: 'tone-warning',
  },
  error: {
    label: 'Error',
    toneClass: 'tone-error',
  },
};

export function StatusBanner({ status }: StatusBannerProps) {
  const tone = STATUS_COPY[status.tone] || STATUS_COPY.info;

  return (
    <section className={`status-banner ${tone.toneClass}`} role="status" aria-live="polite">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em]">{tone.label}</p>
          <p className="mt-2 text-sm font-medium leading-6">{status.message}</p>
        </div>

        <span className="meta-chip self-start bg-white/25 text-current">{status.code}</span>
      </div>
    </section>
  );
}
