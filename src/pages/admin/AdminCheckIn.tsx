import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertOctagon, Camera, CameraOff, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { adminCheckInAttendeeByCodeOrUsn, adminGetAllEvents } from '../../lib/api';
import type { DbEvent } from '../../lib/api';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const AdminCheckIn: React.FC = () => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    success: boolean;
    already_checked_in?: boolean;
    message: string;
    attendee?: {
      name: string;
      department: string;
      year: string;
      reg_no: string;
      confirmation_id: string;
      event_title?: string;
    };
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  const isSecure = typeof window !== 'undefined' && (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'https:'
  );

  useEffect(() => {
    async function loadEvents() {
      const list = await adminGetAllEvents();
      setEvents(list);
      if (list.length > 0) {
        const pub = list.find((e) => e.status === 'published') || list[0];
        setSelectedEventId(pub.id);
      }
    }
    loadEvents();
  }, []);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    if (!isSecure) {
      setCameraError('Camera QR scanning requires HTTPS or localhost security context. Please use manual entry.');
      inputRef.current?.focus();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please enter the Confirmation ID or USN manually.');
      inputRef.current?.focus();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  stopCamera();
                  executeCheckIn(rawValue);
                }
              }
            } catch {}
          }
        }, 300);
      } else {
        setCameraError('Native QR barcode detector not supported in this browser engine. Please enter confirmation ID manually.');
      }
    } catch (err: any) {
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or enter USN / Ticket ID manually.');
      } else {
        setCameraError(err?.message || 'Unable to start camera.');
      }
      inputRef.current?.focus();
    }
  };

  const executeCheckIn = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setLoading(true);
    setResult(null);

    const res = await adminCheckInAttendeeByCodeOrUsn(clean, selectedEventId || undefined);
    setResult(res);
    setLoading(false);
    setQuery(clean);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCheckIn(query);
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-2xl mx-auto">
      <div className="flex flex-col gap-1 pb-3 border-b border-[var(--border)]">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
          Event Operations
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
          Attendee Check-In
        </h1>
        <p className="text-xs text-[var(--text-muted)] m-0">
          Scan QR ticket confirmation ID (e.g. CC-2026-0001) or enter student USN for instant verification.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-md">
        <label htmlFor="checkin-event-select" className="text-xs font-mono uppercase text-[var(--text-muted)]">
          Target Event Scope *
        </label>
        <select
          id="checkin-event-select"
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setResult(null);
          }}
          className="cc-input font-mono text-xs"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} [{ev.status.toUpperCase()}] ({new Date(ev.starts_at).toLocaleDateString('en-IN')})
            </option>
          ))}
        </select>
      </div>

      {!isSecure && (
        <div className="p-3 bg-[var(--warning-surface)] border border-[var(--warning-border)] rounded-sm flex items-center gap-2 text-xs font-mono text-[var(--warning-text)]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Camera QR scanning requires HTTPS in production. Manual entry is fully active.</span>
        </div>
      )}

      {cameraError && (
        <div className="p-3 bg-[var(--danger-surface)] border border-[var(--danger-border)] rounded-sm flex items-center gap-2 text-xs font-mono text-[var(--danger-text)]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {cameraActive ? (
        <div className="flex flex-col gap-3 p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-md">
          <div className="relative w-full aspect-video bg-black rounded-sm overflow-hidden flex items-center justify-center">
            <video ref={videoRef} playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-[var(--accent)] border-dashed pointer-events-none opacity-70 m-8 rounded-sm" />
          </div>
          <button
            type="button"
            onClick={stopCamera}
            className="cc-btn cc-btn--secondary min-h-[52px] text-xs font-mono"
          >
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="cc-btn cc-btn--secondary min-h-[52px] text-xs font-mono font-semibold flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>Activate Camera QR Scanner</span>
        </button>
      )}

      <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan Ticket ID or Enter USN..."
            className="w-full h-14 sm:h-16 px-4 pr-16 bg-[var(--surface-1)] text-[var(--text-strong)] font-mono text-lg sm:text-xl uppercase border-2 border-[var(--border-strong)] rounded-sm focus:border-[var(--accent)] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-strong)] bg-[var(--surface-raised)] border border-[var(--border)] rounded-sm"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="cc-btn cc-btn--primary min-h-[52px] text-base font-mono font-bold"
          >
            {loading ? 'Verifying...' : 'Check In Attendee'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="cc-btn cc-btn--secondary min-h-[52px] text-base font-mono font-medium"
          >
            Reset Form
          </button>
        </div>
      </form>

      {result && (
        <motion.div
          key={query + String(result.success) + String(result.already_checked_in)}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={`p-6 border-2 rounded-md shadow-2 flex flex-col gap-4 text-left ${
            !result.success
              ? 'bg-[var(--danger-surface)] border-[var(--danger-border)] text-[var(--danger-text)]'
              : result.already_checked_in
              ? 'bg-[var(--warning-surface)] border-[var(--warning-border)] text-[var(--warning-text)]'
              : 'bg-[var(--success-surface)] border-[var(--success-border)] text-[var(--success-text)]'
          }`}
        >
          <div className="flex items-center gap-3">
            {!result.success ? (
              <AlertOctagon className="w-8 h-8 text-[var(--danger-text)] shrink-0" />
            ) : result.already_checked_in ? (
              <RefreshCw className="w-8 h-8 text-[var(--warning-text)] shrink-0" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-[var(--success-text)] shrink-0" />
            )}

            <div>
              <div className="font-display font-extrabold text-xl uppercase tracking-tight">
                {!result.success
                  ? 'CHECK-IN REJECTED'
                  : result.already_checked_in
                  ? 'ATTENDEE ALREADY CHECKED IN'
                  : 'CHECK-IN APPROVED'}
              </div>
              <div className="text-xs font-mono mt-0.5 opacity-90">
                {result.message}
              </div>
            </div>
          </div>

          {result.attendee && (
            <div className="p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-3 text-[var(--text-strong)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Name</span>
                <span className="font-bold text-sm">{result.attendee.name}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">USN</span>
                <span className="font-bold text-sm text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">{result.attendee.reg_no}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Department</span>
                <span>{result.attendee.department}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Confirmation ID</span>
                <span className="font-bold">{result.attendee.confirmation_id}</span>
              </div>
              {result.attendee.event_title && (
                <div className="sm:col-span-2 pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase">Event Title</span>
                  <span className="font-semibold">{result.attendee.event_title}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
