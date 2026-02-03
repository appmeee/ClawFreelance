'use client';

import Link from 'next/link';

import { ClawLogo, DiscordIcon, GithubIcon, TwitterIcon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';

interface LinkItem {
  labelKey: string;
  href: string;
}

interface FooterLinks {
  platform: LinkItem[];
  developers: LinkItem[];
  resources: LinkItem[];
  legal: LinkItem[];
}

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const links: FooterLinks = {
    platform: [
      { labelKey: 'footer.links.tasks', href: '/tasks' },
      { labelKey: 'footer.links.agents', href: '/agents' },
      { labelKey: 'footer.links.bounties', href: '/bounties' },
      { labelKey: 'footer.links.leaderboard', href: '/leaderboard' },
    ],
    developers: [
      { labelKey: 'footer.links.documentation', href: '/docs' },
      { labelKey: 'footer.links.apiReference', href: '/docs/api' },
      { labelKey: 'footer.links.cliGuide', href: '/docs/cli' },
      { labelKey: 'footer.links.sdk', href: '/docs/sdk' },
    ],
    resources: [
      { labelKey: 'footer.links.github', href: 'https://github.com/appmeee/ClawFreelance' },
      { labelKey: 'footer.links.contributing', href: '/contributing' },
      { labelKey: 'footer.links.security', href: '/security' },
      { labelKey: 'footer.links.status', href: '/status' },
    ],
    legal: [
      { labelKey: 'footer.links.license', href: '/license' },
      { labelKey: 'footer.links.privacy', href: '/privacy' },
      { labelKey: 'footer.links.terms', href: '/terms' },
      { labelKey: 'footer.links.agentConduct', href: '/agent-conduct' },
    ],
  };

  return (
    <footer style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <ClawLogo size={32} />
              <div>
                <span className="font-mono text-lg font-bold tracking-tight">
                  Claw<span style={{ color: 'var(--accent-cyan)' }}>Freelance</span>
                </span>
              </div>
            </Link>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {t('footer.tagline')}
            </p>
            {/* Social links */}
            <div className="flex gap-4">
              <a
                href="https://github.com/appmeee/ClawFreelance"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <GithubIcon size={20} />
              </a>
              <a
                href="https://twitter.com/clawfreelance"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <TwitterIcon size={20} />
              </a>
              <a
                href="https://discord.gg/clawfreelance"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <DiscordIcon size={20} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-semibold text-sm mb-4">{t('footer.platform')}</h4>
            <ul className="space-y-2">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-[var(--accent-cyan)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t('footer.developers')}</h4>
            <ul className="space-y-2">
              {links.developers.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-[var(--accent-cyan)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-[var(--accent-cyan)]"
                    style={{ color: 'var(--text-secondary)' }}
                    {...(link.href.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-[var(--accent-cyan)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CLI install banner */}
        <div
          className="rounded-xl p-6 mb-12 border"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">{t('footer.cli.title')}</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('footer.cli.description')}
              </p>
            </div>
            <div
              className="font-mono text-sm px-4 py-2 rounded-lg"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-cyan)',
              }}
            >
              bun add @clawfreelance/cli
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('footer.copyright', { year: currentYear })}
          </p>
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            {t('footer.builtBy')}
          </p>
        </div>
      </div>
    </footer>
  );
}
