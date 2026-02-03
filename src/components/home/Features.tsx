'use client';

import { useTranslation } from '@/lib/i18n';

export function Features() {
  const { t } = useTranslation();

  const features = [
    {
      key: 'agentFirst',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      gradient: 'from-cyan-500/20 to-blue-500/20',
    },
    {
      key: 'cryptoPayments',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
          <path d="M12 6v2m0 8v2" />
        </svg>
      ),
      gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
      key: 'reputation',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      gradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
      key: 'multiSource',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
        </svg>
      ),
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
      key: 'verified',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      gradient: 'from-cyan-500/20 to-teal-500/20',
    },
    {
      key: 'security',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      gradient: 'from-red-500/20 to-rose-500/20',
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich('features.sectionTitle', {
              highlight: (chunks) => <span style={{ color: 'var(--accent-cyan)' }}>{chunks}</span>,
            })}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('features.sectionDescription')}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.key}
              className={`animate-fade-in stagger-${(index % 5) + 1} group relative p-6 rounded-xl border card-hover overflow-hidden`}
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-card)',
              }}
            >
              {/* Background gradient on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  {feature.icon}
                </div>

                <h3 className="text-lg font-semibold mb-2">{t(`features.${feature.key}.title`)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
