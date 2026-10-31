import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  Sparkles,
  AlertCircle,
  HelpCircle,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  feedbackSubmissionSchema,
  suggestionCategories,
  issueCategories,
  bugSeverities
} from '../../lib/feedbackValidation';
import {
  submitFeedback,
  captureClientMeta,
  downscaleImage
} from '../../lib/feedbackApi';
import type {
  FeedbackType,
  FeedbackSeverity,
  FeedbackSubmissionPayload
} from '../../types/feedback';

const DRAFT_KEY = 'cc_feedback_draft_v1';

interface FeedbackFormProps {
  initialRoute?: string;
  onSuccess?: (refId: string) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  initialRoute,
  onSuccess
}) => {
  const { mode } = useTheme();

  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState(initialRoute || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [severity, setSeverity] = useState<FeedbackSeverity>('Medium');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [category, setCategory] = useState('');
  const [issueRelatedTo, setIssueRelatedTo] = useState('Event');
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [replyRequested, setReplyRequested] = useState(false);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successReferenceId, setSuccessReferenceId] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.type) setType(parsed.type);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.page && !initialRoute) setPage(parsed.page);
        if (parsed.severity) setSeverity(parsed.severity);
        if (parsed.stepsToReproduce) setStepsToReproduce(parsed.stepsToReproduce);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.issueRelatedTo) setIssueRelatedTo(parsed.issueRelatedTo);
        if (parsed.anonymous !== undefined) setAnonymous(parsed.anonymous);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.replyRequested !== undefined) setReplyRequested(parsed.replyRequested);
      }
    } catch {
    }
  }, [initialRoute]);

  useEffect(() => {
    if (successReferenceId) return;
    try {
      const draft = {
        type,
        title,
        description,
        page,
        severity,
        stepsToReproduce,
        category,
        issueRelatedTo,
        anonymous,
        name,
        email,
        replyRequested
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
    }
  }, [
    type,
    title,
    description,
    page,
    severity,
    stepsToReproduce,
    category,
    issueRelatedTo,
    anonymous,
    name,
    email,
    replyRequested,
    successReferenceId
  ]);

  const handleTypeSelect = (selected: FeedbackType) => {
    setType(selected);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.type;
      delete next.severity;
      delete next.page;
      delete next.category;
      return next;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessingImage(true);
    try {
      const downscaled = await downscaleImage(file);
      setScreenshotDataUrl(downscaled);
      setScreenshotFileName(file.name);
    } catch (err: any) {
      setImageError(err.message || 'Image processing failed');
      setScreenshotDataUrl(null);
      setScreenshotFileName(null);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeScreenshot = () => {
    setScreenshotDataUrl(null);
    setScreenshotFileName(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = ():
    | { success: false; errors: Record<string, string> }
    | { success: true; data: any } => {
    const payload: Record<string, any> = {
      type,
      title: title.trim(),
      description: description.trim(),
      replyRequested,
      anonymous,
      websiteUrl: honeypot
    };

    if (type === 'bug') {
      payload.page = page.trim();
      payload.severity = severity;
      payload.stepsToReproduce = stepsToReproduce.trim();
      payload.screenshotUrl = screenshotDataUrl || '';
    } else if (type === 'suggestion') {
      payload.category = category;
    } else if (type === 'issue') {
      payload.category = issueRelatedTo;
    }

    if (!anonymous) {
      payload.name = name.trim();
      payload.email = email.trim();
    }

    const result = feedbackSubmissionSchema.safeParse(payload);
    const fieldErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
    }

    if (!anonymous && (name.trim() || email.trim() || replyRequested) && !consent) {
      fieldErrors.consent = 'Consent is required to submit contact details under DPDP Act, 2023.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, errors: fieldErrors };
    }

    return { success: true, data: result.data };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validate();
    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.title && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (validation.errors.description && descInputRef.current) {
        descInputRef.current.focus();
      } else if (validation.errors.page && pageInputRef.current) {
        pageInputRef.current.focus();
      } else if (validation.errors.email && emailInputRef.current) {
        emailInputRef.current.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const meta = captureClientMeta(mode, page);
    const submissionPayload: FeedbackSubmissionPayload = {
      type,
      title: title.trim(),
      description: description.trim(),
      websiteUrl: honeypot,
      meta
    };

    if (type === 'bug') {
      submissionPayload.page = page.trim();
      submissionPayload.severity = severity;
      submissionPayload.stepsToReproduce = stepsToReproduce.trim() || undefined;
      submissionPayload.screenshotUrl = screenshotDataUrl || undefined;
    } else if (type === 'suggestion') {
      submissionPayload.category = category;
    } else if (type === 'issue') {
      submissionPayload.category = issueRelatedTo;
      submissionPayload.anonymous = anonymous;
    }

    if (!anonymous) {
      submissionPayload.name = name.trim() || undefined;
      submissionPayload.email = email.trim() || undefined;
      submissionPayload.replyRequested = replyRequested;
    } else {
      submissionPayload.anonymous = true;
      submissionPayload.replyRequested = false;
    }

    try {
      const res = await submitFeedback(submissionPayload);
      if (res.success && res.referenceId) {
        setSuccessReferenceId(res.referenceId);
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
        }
        if (onSuccess) {
          onSuccess(res.referenceId);
        }
      } else {
        setSubmitError(res.error || 'Unable to submit feedback. Please try again.');
      }
    } catch {
      setSubmitError('Network error encountered. Your draft has been kept safely, please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessReferenceId(null);
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setScreenshotDataUrl(null);
    setScreenshotFileName(null);
    setName('');
    setEmail('');
    setReplyRequested(false);
    setConsent(false);
    setAnonymous(false);
    setErrors({});
    setSubmitError(null);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
    }
  };

  const copyRefId = async () => {
    if (!successReferenceId) return;
    try {
      await navigator.clipboard.writeText(successReferenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
    }
  };

  if (successReferenceId) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-6 px-4 text-center">
        <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border)] rounded-sm p-6 sm:p-8 shadow-3 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[var(--color-success-soft)] border border-[var(--color-success-border)] flex items-center justify-center text-[var(--color-success-strong)] dark:text-[var(--color-success)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
              Transmission Confirmed
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-[var(--text-strong)] m-0">
              Thank you for your feedback!
            </h2>
            <p className="text-sm font-body text-[var(--text-muted)] mt-1">
              Your report has been logged and assigned to the club coordinators.
            </p>
          </div>

          <div className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex flex-col items-center gap-1.5">
            <span className="text-xs font-mono uppercase text-[var(--text-subtle)] tracking-wider">
              Tracking Reference ID
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-mono font-bold tracking-widest text-[var(--primary)] dark:text-[var(--accent-on-dark)] select-all">
                {successReferenceId}
              </span>
              <button
                type="button"
                onClick={copyRefId}
                aria-label="Copy reference ID"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[var(--text-muted)] hover:text-[var(--text-strong)] rounded-sm cursor-pointer"
              >
                {copiedRef ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="cc-btn cc-btn--secondary min-h-[44px] w-full text-xs font-mono justify-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit another</span>
            </button>
            <Link
              to="/"
              className="cc-btn cc-btn--primary min-h-[44px] w-full text-xs font-mono justify-center no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const typeOptions: { id: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'bug', label: 'Bug report', icon: Bug },
    { id: 'suggestion', label: 'Club suggestion', icon: Sparkles },
    { id: 'issue', label: 'Issue / complaint', icon: AlertCircle },
    { id: 'other', label: 'Other', icon: HelpCircle }
  ];

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full flex flex-col gap-6 text-left"
    >
      <div
        ref={liveRegionRef}
        aria-live="polite"
        className="sr-only"
      >
        {submitError ? `Error: ${submitError}` : ''}
      </div>

      {submitError && (
        <div className="p-4 bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] rounded-sm flex items-start justify-between gap-3 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] text-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold font-sans">Submission Failed</span>
              <span className="font-body text-xs sm:text-sm">{submitError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="shrink-0 px-2.5 py-1 text-xs font-mono font-semibold bg-[var(--surface-1)] border border-[var(--color-danger-border)] rounded-sm text-[var(--text-strong)] hover:bg-[var(--surface-2)] cursor-pointer min-h-[44px] flex items-center"
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
        <label htmlFor="websiteUrl">Leave blank</label>
        <input
          id="websiteUrl"
          type="text"
          name="websiteUrl"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label id="feedback-type-label" className="text-sm font-bold font-sans text-[var(--text-strong)] flex items-center gap-1">
          <span>Feedback Type</span>
          <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
        </label>
        <div
          role="radiogroup"
          aria-labelledby="feedback-type-label"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm"
        >
          {typeOptions.map((opt) => {
            const isSelected = type === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleTypeSelect(opt.id)}
                className={`min-h-[44px] px-3 py-2 flex items-center justify-center gap-2 rounded-xs text-xs font-mono font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface-1)] text-[var(--text-strong)] border border-[var(--border-strong)] shadow-1 font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--primary)] dark:text-[var(--accent-on-dark)]' : ''}`} />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feedback-title" className="text-sm font-bold font-sans text-[var(--text-strong)] flex items-center gap-1">
            <span>Title</span>
            <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
          </label>
          <span className="text-xs font-mono text-[var(--text-subtle)]">
            {title.length}/100
          </span>
        </div>
        <input
          ref={titleInputRef}
          id="feedback-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === 'bug'
              ? 'Brief summary of the issue (e.g., Register button unresponsive on mobile)'
              : type === 'suggestion'
              ? 'Idea title (e.g., Host monthly open-source lightning talks)'
              : 'Title or subject'
          }
          className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface-1)] border rounded-sm text-base font-body text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
            errors.title ? 'border-[var(--color-danger)]' : 'border-[var(--border)]'
          }`}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'feedback-title-error' : undefined}
        />
        {errors.title && (
          <span id="feedback-title-error" className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.title}</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feedback-desc" className="text-sm font-bold font-sans text-[var(--text-strong)] flex items-center gap-1">
            <span>Description</span>
            <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
          </label>
          <span className={`text-xs font-mono ${description.length < 20 || description.length > 2000 ? 'text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]' : 'text-[var(--text-subtle)]'}`}>
            {description.length} / 2000 (min 20)
          </span>
        </div>
        <textarea
          ref={descInputRef}
          id="feedback-desc"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide detailed information so coordinators can understand and act on this report..."
          className={`w-full px-3.5 py-2.5 bg-[var(--surface-1)] border rounded-sm text-base font-body text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] leading-relaxed resize-y min-h-[110px] ${
            errors.description ? 'border-[var(--color-danger)]' : 'border-[var(--border)]'
          }`}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'feedback-desc-error' : undefined}
        />
        {errors.description && (
          <span id="feedback-desc-error" className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.description}</span>
          </span>
        )}
      </div>

      {type === 'bug' && (
        <div className="flex flex-col gap-5 p-4 sm:p-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Bug className="w-4 h-4 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" />
            <span className="font-mono text-xs uppercase font-bold tracking-wider text-[var(--text-strong)]">
              Bug Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bug-page" className="text-sm font-semibold font-sans text-[var(--text-strong)] flex items-center gap-1">
                <span>Page / URL</span>
                <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
              </label>
              <input
                ref={pageInputRef}
                id="bug-page"
                type="text"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="/events or URL where bug occurred"
                className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface-1)] border rounded-sm text-base font-body text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
                  errors.page ? 'border-[var(--color-danger)]' : 'border-[var(--border)]'
                }`}
              />
              {errors.page && (
                <span className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">
                  {errors.page}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bug-severity" className="text-sm font-semibold font-sans text-[var(--text-strong)] flex items-center gap-1">
                <span>Severity</span>
                <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm">
                {bugSeverities.map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`min-h-[44px] flex items-center justify-center text-xs font-mono font-medium rounded-xs cursor-pointer ${
                      severity === sev
                        ? sev === 'High'
                          ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-bold border border-[var(--color-danger-border)]'
                          : sev === 'Medium'
                          ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] font-bold border border-[var(--color-warning-border)]'
                          : 'bg-[var(--surface-3)] text-[var(--text-strong)] font-bold border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bug-steps" className="text-sm font-semibold font-sans text-[var(--text-strong)]">
              Steps to Reproduce (optional)
            </label>
            <textarea
              id="bug-steps"
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Go to Events page&#10;2. Click on Git Workshop&#10;3. Click Register button"
              className="w-full px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-base font-body text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] leading-relaxed resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold font-sans text-[var(--text-strong)]">
              Screenshot (optional, 1 image, max 3 MB)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              id="bug-screenshot"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />

            {!screenshotDataUrl ? (
              <label
                htmlFor="bug-screenshot"
                className="w-full min-h-[56px] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-sm p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-[var(--surface-1)] hover:bg-[var(--surface-3)] transition-colors text-center"
              >
                {isProcessingImage ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                    <span>Optimizing and downscaling image...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-[var(--text-subtle)]" />
                    <span className="text-xs font-mono font-medium text-[var(--text-strong)]">
                      Tap to select screenshot (JPEG, PNG, WebP)
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-subtle)]">
                      Automatically downscaled client-side
                    </span>
                  </>
                )}
              </label>
            ) : (
              <div className="p-3 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={screenshotDataUrl}
                    alt="Screenshot preview"
                    className="w-12 h-12 object-cover rounded-xs border border-[var(--border)]"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono font-medium text-[var(--text-strong)] truncate max-w-[200px]">
                      {screenshotFileName || 'screenshot.webp'}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--color-success-strong)] dark:text-[var(--color-success)]">
                      Image attached
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[var(--text-muted)] hover:text-[var(--color-danger-strong)] rounded-sm cursor-pointer"
                  aria-label="Remove attached screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {imageError && (
              <span className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{imageError}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {type === 'suggestion' && (
        <div className="flex flex-col gap-2 p-4 sm:p-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
          <label htmlFor="suggestion-category" className="text-sm font-semibold font-sans text-[var(--text-strong)] flex items-center gap-1">
            <span>Suggestion Category</span>
            <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {suggestionCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-[#FDE047]/20 border-[#FDE047] text-[#854d0e] dark:text-[#FDE047] font-bold'
                    : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <span className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">
              {errors.category}
            </span>
          )}
        </div>
      )}

      {type === 'issue' && (
        <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold font-sans text-[var(--text-strong)] flex items-center gap-1">
              <span>Related to</span>
              <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]" aria-hidden="true">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {issueCategories.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setIssueRelatedTo(rel)}
                  className={`min-h-[44px] px-3.5 py-2 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                    issueRelatedTo === rel
                      ? 'bg-[var(--color-warning-soft)] border-[var(--color-warning-border)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] font-bold'
                      : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px] select-none">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="w-5 h-5 rounded-xs accent-[var(--primary)] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-strong)]">
                  Submit anonymously
                </span>
                <span className="text-xs font-mono text-[var(--text-subtle)]">
                  Neither your name, email, nor IP address will be recorded in readable form.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {!anonymous && (
        <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm">
          <span className="text-sm font-bold font-sans text-[var(--text-strong)]">
            Contact Information (optional)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-name" className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Your Name
              </label>
              <input
                id="feedback-name"
                type="text"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm text-base font-body text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-email" className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Contact Email</span>
                {replyRequested && (
                  <span className="text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] font-bold">* Required for reply</span>
                )}
              </label>
              <input
                ref={emailInputRef}
                id="feedback-email"
                type="email"
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. you@example.com"
                className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface-2)] border rounded-sm text-base font-body text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
                  errors.email ? 'border-[var(--color-danger)]' : 'border-[var(--border)]'
                }`}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <span className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer min-h-[44px] select-none pt-1">
            <input
              type="checkbox"
              checked={replyRequested}
              onChange={(e) => setReplyRequested(e.target.checked)}
              className="w-5 h-5 rounded-xs accent-[var(--primary)] cursor-pointer"
            />
            <span className="text-sm font-body text-[var(--text-strong)]">
              Reply to me with updates on this feedback
            </span>
          </label>

          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            <span className="text-xs text-[var(--text-muted)] leading-relaxed">
              In compliance with the Digital Personal Data Protection Act, 2023, your contact information is collected exclusively to follow up on this feedback and will not be shared with third parties.
            </span>
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px] select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-xs accent-[var(--primary)] cursor-pointer"
                aria-invalid={Boolean(errors.consent)}
              />
              <span className="text-xs font-body text-[var(--text-strong)] leading-normal">
                I consent to the collection and processing of my contact information for feedback follow-up.
              </span>
            </label>
            {errors.consent && (
              <span className="text-xs font-mono text-[var(--color-danger-strong)] dark:text-[var(--color-danger)]">
                {errors.consent}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <span className="text-xs font-mono text-[var(--text-subtle)] order-2 sm:order-1 text-center sm:text-left">
          3 submissions max / hour per IP. Autosaved to browser storage.
        </span>

        <button
          type="submit"
          disabled={isSubmitting || isProcessingImage}
          className="cc-btn cc-btn--primary min-h-[44px] px-6 text-sm font-mono font-semibold w-full sm:w-auto justify-center order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transmitting...</span>
            </>
          ) : (
            <span>Submit Feedback</span>
          )}
        </button>
      </div>
    </form>
  );
};
