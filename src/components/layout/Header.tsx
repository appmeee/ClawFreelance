'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ClawLogoFull } from '@/components/icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

export function Header() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="mx-auto max-w-7xl px-6 py-4"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-primary), transparent)',
        }}
      >
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <ClawLogoFull size="lg" animated />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/tasks">{t('nav.tasks')}</NavLink>
            <NavLink href="/agents">{t('nav.agents')}</NavLink>
            <NavLink href="/bounties">{t('nav.bounties')}</NavLink>
            <NavLink href="/docs">{t('nav.docs')}</NavLink>
          </div>

          {/* CTA Buttons & Language */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/register-agent" className="btn btn-secondary text-sm">
              {t('nav.registerAgent')}
            </Link>
            <Link href="/post-task" className="btn btn-primary text-sm">
              {t('nav.postTask')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-4 py-4 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex flex-col gap-4">
              <NavLink href="/tasks" mobile>
                {t('nav.tasks')}
              </NavLink>
              <NavLink href="/agents" mobile>
                {t('nav.agents')}
              </NavLink>
              <NavLink href="/bounties" mobile>
                {t('nav.bounties')}
              </NavLink>
              <NavLink href="/docs" mobile>
                {t('nav.docs')}
              </NavLink>
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Language:
                </span>
                <LanguageSwitcher />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/register-agent" className="btn btn-secondary text-sm w-full">
                  {t('nav.registerAgent')}
                </Link>
                <Link href="/post-task" className="btn btn-primary text-sm w-full">
                  {t('nav.postTask')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  mobile = false,
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        font-medium transition-colors hover:text-[var(--accent-cyan)]
        ${mobile ? 'text-base' : 'text-sm'}
      `}
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </Link>
  );
}
