'use client';

import { useEffect, useState } from 'react';

import { HealthIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked?: string;
}

const mockServices: ServiceStatus[] = [
  { name: 'API', status: 'operational', latency: 45, lastChecked: new Date().toISOString() },
  { name: 'Database', status: 'operational', latency: 12, lastChecked: new Date().toISOString() },
  { name: 'Task Queue', status: 'operational', latency: 8, lastChecked: new Date().toISOString() },
  {
    name: 'Payment Processing',
    status: 'operational',
    latency: 230,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'Agent Registry',
    status: 'operational',
    latency: 32,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'Webhook Delivery',
    status: 'operational',
    latency: 15,
    lastChecked: new Date().toISOString(),
  },
];

const recentIncidents = [
  {
    date: '2025-01-28',
    title: 'Scheduled Maintenance',
    description: 'Database optimization completed successfully.',
    status: 'resolved',
  },
  {
    date: '2025-01-15',
    title: 'API Latency',
    description: 'Increased response times due to high traffic. Auto-scaling activated.',
    status: 'resolved',
  },
];

export default function StatusPage() {
  const { t } = useTranslation();
  const services = mockServices;
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date().toISOString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = services.every((s) => s.status === 'operational');

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <HealthIcon
                size={36}
                className="inline mr-3"
                style={{ color: 'var(--status-success)' }}
              />
              {t('statusPage.title')}
            </h1>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              {t('statusPage.description')}
            </p>

            {/* Overall Status */}
            <div
              className={`rounded-xl border p-6 mb-8`}
              style={{
                borderColor: allOperational ? 'var(--status-success)' : 'var(--status-error)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-4 h-4 rounded-full animate-pulse`}
                  style={{
                    background: allOperational ? 'var(--status-success)' : 'var(--status-error)',
                  }}
                />
                <div>
                  <h2 className="text-xl font-semibold">
                    {allOperational ? t('statusPage.allOperational') : t('statusPage.someIssues')}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('statusPage.lastUpdated')} {new Date(lastUpdate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div
              className="rounded-xl border overflow-hidden mb-8"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
            >
              <div
                className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium border-b"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                }}
              >
                <div className="col-span-5">{t('statusPage.tableHeaders.service')}</div>
                <div className="col-span-3">{t('statusPage.tableHeaders.status')}</div>
                <div className="col-span-4 text-right">{t('statusPage.tableHeaders.latency')}</div>
              </div>
              {services.map((service) => (
                <div
                  key={service.name}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b last:border-b-0"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="col-span-5 font-medium">{service.name}</div>
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium`}
                      style={{
                        background:
                          service.status === 'operational'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : service.status === 'degraded'
                              ? 'rgba(245, 158, 11, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                        color:
                          service.status === 'operational'
                            ? 'var(--status-success)'
                            : service.status === 'degraded'
                              ? 'var(--accent-amber)'
                              : 'var(--status-error)',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            service.status === 'operational'
                              ? 'var(--status-success)'
                              : service.status === 'degraded'
                                ? 'var(--accent-amber)'
                                : 'var(--status-error)',
                        }}
                      />
                      {t(`statusPage.serviceStatus.${service.status}`)}
                    </span>
                  </div>
                  <div
                    className="col-span-4 text-right font-mono text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {service.latency}ms
                  </div>
                </div>
              ))}
            </div>

            {/* Uptime Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-xl border p-6 text-center"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div
                  className="font-mono text-3xl font-bold mb-1"
                  style={{ color: 'var(--status-success)' }}
                >
                  99.95%
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('statusPage.stats.uptime')}
                </div>
              </div>
              <div
                className="rounded-xl border p-6 text-center"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div
                  className="font-mono text-3xl font-bold mb-1"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  48ms
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('statusPage.stats.avgResponse')}
                </div>
              </div>
              <div
                className="rounded-xl border p-6 text-center"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div
                  className="font-mono text-3xl font-bold mb-1"
                  style={{ color: 'var(--accent-amber)' }}
                >
                  0
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('statusPage.stats.activeIncidents')}
                </div>
              </div>
            </div>

            {/* Recent Incidents */}
            <div
              className="rounded-xl border p-6"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
            >
              <h2 className="text-xl font-semibold mb-4">{t('statusPage.recentIncidents')}</h2>
              {recentIncidents.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>{t('statusPage.noIncidents')}</p>
              ) : (
                <div className="space-y-4">
                  {recentIncidents.map((incident, i) => (
                    <div
                      key={i}
                      className="p-4 rounded"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background:
                              incident.status === 'resolved'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                            color:
                              incident.status === 'resolved'
                                ? 'var(--status-success)'
                                : 'var(--accent-amber)',
                          }}
                        >
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {incident.description}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {incident.date}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
