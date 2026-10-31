import React from 'react';
import { Link } from 'react-router-dom';
import { HairlineGrid } from '../components/HairlineGrid';
import { Home, Calendar, Users, Image, Info, Mail } from 'lucide-react';
import { COPY } from '../content/copy';

export const NotFound: React.FC = () => {
  const sitemapLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  return (
    <HairlineGrid>
      <section className="hairline-row p-6 sm:p-12 lg:p-16 bg-[var(--bg)] min-h-[55vh] flex flex-col items-start justify-center text-left" aria-labelledby="notfound-heading">
        <div className="max-w-2xl flex flex-col items-start gap-5">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Error 404
          </span>
          <h1
            id="notfound-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-none m-0"
          >
            Page not found
          </h1>
          <p className="text-base text-[var(--text-muted)] leading-relaxed m-0">
            The page you requested does not exist or may have been relocated. Use the direct links or sitemap below to navigate the Coders Club website.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/" className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold">
              <span>Go to home</span>
            </Link>

            <Link to="/events" className="cc-btn cc-btn--secondary min-h-[44px] px-6 text-sm font-mono font-semibold">
              <span>{COPY.actions.seeEvents}</span>
            </Link>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-[var(--border)] flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Website Sitemap
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sitemapLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="p-2.5 rounded-sm bg-[var(--surface-1)] border border-[var(--border)] text-xs font-mono text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center gap-2 no-underline transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
