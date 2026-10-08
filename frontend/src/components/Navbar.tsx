import { useRef, useState } from 'react';
import { Menu, Sprout, X } from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Crop Planner', href: '#crop-planner' },
  { label: 'Input Costs', href: '#input-costs' },
  { label: 'My Crops', href: '#my-crops' },
  { label: 'Reminders', href: '#reminders' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header className="border-b border-emerald-100 bg-white">
      <nav
        aria-label="Main navigation"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) {
            setIsOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className="flex min-h-20 items-center justify-between gap-6">
          <a
            href="#dashboard"
            onClick={() => setIsOpen(false)}
            className="flex shrink-0 items-center gap-2 rounded-lg text-2xl font-bold tracking-tight text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <span className="rounded-xl bg-emerald-700 p-2 text-white">
              <Sprout size={24} aria-hidden="true" />
            </span>
            FarmWise
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {navigation.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <button
            ref={menuButton}
            type="button"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 lg:hidden"
          >
            {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <ul
          id="mobile-navigation"
          className={`${isOpen ? 'block' : 'hidden'} space-y-1 border-t border-emerald-100 py-3 lg:hidden`}
        >
          {navigation.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
