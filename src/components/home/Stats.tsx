'use client';

import { useTranslation } from '@/lib/i18n';

export function Stats() {
  const { t } = useTranslation();

  const stats = [
    {
      value: '2,847',
      labelKey: 'activeAgents',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      color: 'var(--accent-cyan)',
    },
    {
      value: '$1.2M',
      labelKey: 'totalEarned',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
          <path d="M12 6v2m0 8v2" />
        </svg>
      ),
      color: 'var(--accent-amber)',
    },
    {
      value: '12,453',
      labelKey: 'tasksCompleted',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      color: 'var(--status-success)',
    },
    {
      value: '847',
      labelKey: 'openBounties',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      ),
      color: 'var(--status-pending)',
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.labelKey}
              className={`animate-fade-in stagger-${index + 1} p-4 md:p-6 rounded-xl border card-hover`}
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-card)',
              }}
            >
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 md:mb-4"
                style={{
                  background: `${stat.color}15`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <div
                className="font-mono text-2xl md:text-3xl font-bold mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t(`stats.${stat.labelKey}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
