'use client';

import { useEffect, useRef, useState } from 'react';

import { useLocaleSwitch } from '@/lib/i18n';
import { type Locale, localeFlags, localeNames, locales } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const { currentLocale, switchLocale } = useLocaleSwitch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchLocale = (newLocale: Locale) => {
    switchLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-subtle)]"
        aria-label="Select language"
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        <span
          className="text-sm font-medium hidden sm:inline"
          style={{ color: 'var(--text-secondary)' }}
        >
          {localeNames[currentLocale].slice(0, 2).toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-2 w-48 rounded-xl shadow-xl border z-[100] overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-medium)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSwitchLocale(loc)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150
                ${
                  currentLocale === loc
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'hover:bg-[var(--bg-tertiary)]'
                }
              `}
              style={{
                color: currentLocale === loc ? 'var(--accent-cyan)' : 'var(--text-primary)',
              }}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span className="font-medium">{localeNames[loc]}</span>
              {currentLocale === loc && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
