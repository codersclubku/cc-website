import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUpRight, AlertCircle } from 'lucide-react';
import { HairlineGrid } from '../components/HairlineGrid';
import { Alert } from '../components/Alert';
import { GithubIcon, InstagramIcon } from '../components/SocialIcons';
import { KULogo } from '../components/KULogo';
import { SITE_CONSTANTS } from '../content/site';
import { submitContactMessage } from '../lib/api';
import { contactSchema } from '../lib/validation';
import { COPY } from '../content/copy';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  consent: boolean;
  websiteUrl: string;
}

const DRAFT_KEY = 'cc-contact-draft';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
    }
    return {
      name: '',
      email: '',
      message: '',
      consent: false,
      websiteUrl: '',
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch {
    }
  }, [formData]);

  const validateField = (field: keyof ContactFormData, value: any): string => {
    const partial = { ...formData, [field]: value };
    const res = contactSchema.safeParse(partial);
    if (!res.success) {
      const match = res.error.issues.find((i) => i.path[0] === field);
      return match ? match.message : '';
    }
    return '';
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleChange = (field: keyof ContactFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({ name: true, email: true, message: true, consent: true });
      setTimeout(() => {
        errorSummaryRef.current?.focus();
        errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await submitContactMessage(validation.data);
      if (!res.success) {
        setServerError(res.message);
      } else {
        setSubmitted(true);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
        }
      }
    } catch {
      setServerError('Could not send your message. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HairlineGrid>
      <section className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left" aria-labelledby="contact-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Communications
              </span>
              <h1
                id="contact-heading"
                className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text)] leading-tight m-0"
              >
                Contact
              </h1>
              <p className="text-base text-[var(--text-muted)] mt-2 leading-relaxed">
                Official contact channel for collaborations, university administration, and external partners.
              </p>
            </div>

            <div className="p-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-bold">
                Kishkinda University Students
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] m-0">
                Join the club directly without coordinator approval
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed m-0">
                You do not need to send messages or request permission to participate. Create your student account to join Coders Club directly and unlock 1-click registration for all events.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  to="/signup"
                  className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-bold"
                >
                  Create student account
                </Link>
                <Link
                  to="/events"
                  className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono font-semibold"
                >
                  Browse events
                </Link>
              </div>
            </div>

            <div className="p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Official Email
              </span>
              <a
                href={`mailto:${SITE_CONSTANTS.email}`}
                className="text-base font-mono font-medium text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 break-all"
              >
                {SITE_CONSTANTS.email}
              </a>
              <span className="text-xs text-[var(--text-muted)]">
                The primary communication channel for general queries and official correspondence.
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Online Presence
              </span>

              <a
                href={SITE_CONSTANTS.githubOrgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex items-center justify-between text-sm text-[var(--text)] hover:border-[var(--accent)] no-underline"
              >
                <span className="flex items-center gap-2">
                  <GithubIcon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-mono text-xs sm:text-sm">GitHub / {SITE_CONSTANTS.githubOrg}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]" />
              </a>

              <a
                href={SITE_CONSTANTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex items-center justify-between text-sm text-[var(--text)] hover:border-[var(--accent)] no-underline"
              >
                <span className="flex items-center gap-2">
                  <InstagramIcon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-mono text-xs sm:text-sm">Instagram / {SITE_CONSTANTS.instagram}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]" />
              </a>

              <a
                href={SITE_CONSTANTS.universityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex items-center justify-between text-sm text-[var(--text)] hover:border-[var(--accent)] no-underline"
              >
                <span className="flex items-center gap-2.5">
                  <KULogo className="h-5 w-auto shrink-0" />
                  <span className="font-mono text-xs sm:text-sm">{SITE_CONSTANTS.university}</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="p-6 sm:p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-2">
              <h2 className="text-xl font-bold font-sans text-[var(--text)] m-0 mb-4">
                Send a message
              </h2>

              {submitted ? (
                <div className="flex flex-col gap-4">
                  <Alert
                    type="success"
                    title="Message sent"
                    message={COPY.forms.messageSentSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', message: '', consent: false, websiteUrl: '' });
                    }}
                    className="cc-btn cc-btn--secondary self-start min-h-[44px]"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 max-w-xl">
                  {serverError && (
                    <Alert
                      type="error"
                      title="Could not send message"
                      message={serverError}
                    />
                  )}

                  {Object.keys(errors).length > 0 && (
                    <div
                      ref={errorSummaryRef}
                      tabIndex={-1}
                      role="alert"
                      aria-labelledby="contact-error-summary-title"
                      className="p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-md text-left flex flex-col gap-2 focus:outline-none"
                    >
                      <div className="flex items-center gap-2 text-[var(--danger-text)] font-semibold text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span id="contact-error-summary-title">{COPY.forms.errorSummaryTitle}</span>
                      </div>
                      <ul className="text-xs text-[var(--danger-text)] list-disc pl-5 m-0 space-y-1">
                        {errors.name && (
                          <li>
                            <a href="#contact-name" className="underline hover:text-[var(--danger-strong)]">
                              Full name: {errors.name}
                            </a>
                          </li>
                        )}
                        {errors.email && (
                          <li>
                            <a href="#contact-email" className="underline hover:text-[var(--danger-strong)]">
                              Email address: {errors.email}
                            </a>
                          </li>
                        )}
                        {errors.message && (
                          <li>
                            <a href="#contact-message" className="underline hover:text-[var(--danger-strong)]">
                              Message: {errors.message}
                            </a>
                          </li>
                        )}
                        {errors.consent && (
                          <li>
                            <a href="#contact-consent" className="underline hover:text-[var(--danger-strong)]">
                              Consent: {errors.consent}
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="contact-websiteUrl">Do not fill this</label>
                    <input
                      type="text"
                      id="contact-websiteUrl"
                      name="websiteUrl"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    />
                  </div>

                  <div className="cc-field">
                    <label htmlFor="contact-name" className="text-sm font-semibold text-[var(--text)]">
                      {COPY.forms.nameLabel}
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      enterKeyHint="next"
                      disabled={isSubmitting}
                      value={formData.name}
                      onBlur={() => handleBlur('name')}
                      onChange={(e) => handleChange('name', e.target.value)}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      className="cc-input text-base"
                      placeholder={COPY.forms.namePlaceholder}
                    />
                    {errors.name && (
                      <span id="contact-name-error" className="cc-error text-xs font-medium text-[var(--danger-text)]" role="alert">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="cc-field">
                    <label htmlFor="contact-email" className="text-sm font-semibold text-[var(--text)]">
                      {COPY.forms.emailLabel}
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      enterKeyHint="next"
                      disabled={isSubmitting}
                      value={formData.email}
                      onBlur={() => handleBlur('email')}
                      onChange={(e) => handleChange('email', e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      className="cc-input text-base"
                      placeholder={COPY.forms.emailPlaceholder}
                    />
                    {errors.email && (
                      <span id="contact-email-error" className="cc-error text-xs font-medium text-[var(--danger-text)]" role="alert">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="cc-field">
                    <label htmlFor="contact-message" className="text-sm font-semibold text-[var(--text)]">
                      {COPY.forms.messageLabel}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      enterKeyHint="done"
                      disabled={isSubmitting}
                      value={formData.message}
                      onBlur={() => handleBlur('message')}
                      onChange={(e) => handleChange('message', e.target.value)}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      className="cc-textarea text-base"
                      placeholder={COPY.forms.messagePlaceholder}
                    />
                    {errors.message && (
                      <span id="contact-message-error" className="cc-error text-xs font-medium text-[var(--danger-text)]" role="alert">
                        {errors.message}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      id="contact-consent"
                      name="consent"
                      disabled={isSubmitting}
                      checked={formData.consent}
                      onBlur={() => handleBlur('consent')}
                      onChange={(e) => handleChange('consent', e.target.checked)}
                      className="w-5 h-5 mt-0.5 border border-[var(--border-strong)] rounded-xs accent-[var(--accent)] cursor-pointer"
                      aria-invalid={!!errors.consent}
                      aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
                    />
                    <label htmlFor="contact-consent" className="text-xs leading-relaxed text-[var(--text-muted)] cursor-pointer">
                      {COPY.forms.consentLabel}
                    </label>
                  </div>
                  {errors.consent && (
                    <span id="contact-consent-error" className="cc-error text-xs font-medium text-[var(--danger-text)]" role="alert">
                      {errors.consent}
                    </span>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="cc-btn cc-btn--primary min-h-[44px] px-8 text-sm font-mono font-semibold cursor-pointer"
                    >
                      {isSubmitting ? 'Sending message...' : COPY.actions.sendMessage}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </HairlineGrid>
  );
};
