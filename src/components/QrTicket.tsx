import React from 'react';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';

interface QrTicketProps {
  confirmationId: string;
  eventTitle: string;
  startsAt?: string;
  venue?: string;
  studentName?: string;
  usn?: string;
  status?: string;
  checkedInAt?: string | null;
}

export const QrTicket: React.FC<QrTicketProps> = ({
  confirmationId,
  eventTitle,
  startsAt,
  venue,
  studentName,
  usn,
  status = 'registered',
  checkedInAt
}) => {
  const eventDate = startsAt ? new Date(startsAt) : null;

  return (
    <div className="w-full bg-[var(--surface-raised)] border-2 border-[var(--border)] rounded-sm overflow-hidden flex flex-col sm:flex-row text-left shadow-sm">
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-bold">
              Official Entry Pass
            </span>
            {checkedInAt && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-success-soft)] text-[var(--color-success-strong)] dark:text-[var(--color-success)] border border-[var(--color-success-border)] rounded-xs">
                CHECKED IN
              </span>
            )}
            {status === 'cancelled' && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] border border-[var(--color-danger-border)] rounded-xs">
                CANCELLED
              </span>
            )}
          </div>
          <h3 className="font-display font-extrabold text-xl sm:text-2xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            {eventTitle}
          </h3>
          {studentName && (
            <p className="text-xs font-mono text-[var(--text-muted)] m-0">
              Attendee: <strong className="text-[var(--text-strong)]">{studentName}</strong> {usn ? `(${usn})` : ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>
              {eventDate
                ? eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>
              {eventDate
                ? eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'TBA'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text)] sm:col-span-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="truncate">{venue || 'Kishkinda University Campus'}</span>
          </div>
        </div>
      </div>

      <div className="sm:w-44 bg-white p-5 flex flex-col items-center justify-center gap-2 border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-[var(--border)] shrink-0">
        <svg
          viewBox="0 0 29 29"
          className="w-24 h-24 text-black fill-current"
          shapeRendering="crispEdges"
          aria-label={`QR Ticket for ${confirmationId}`}
        >
          <path d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM22 0h7v7h-7zM23 1v5h5V1zM24 2h3v3h-3zM0 22h7v7H0zM1 23v5h5v-5zM2 24h3v3H2zM9 1h2v1H9zM13 1h3v1h-3zM18 1h1v1h-1zM10 3h1v3h-1zM13 3h1v2h-1zM17 3h2v1h-2zM9 6h2v1H9zM14 6h2v1h-2zM18 6h1v1h-1zM8 8h1v1H8zM11 8h2v1h-2zM15 8h1v1h-1zM17 8h1v2h-1zM20 8h2v1h-2zM24 8h1v1h-1zM26 8h2v2h-2zM1 9h1v1H1zM4 9h1v2H4zM6 9h1v1H6zM9 10h1v1H9zM12 10h2v1h-2zM16 10h1v1h-1zM21 10h1v1h-1zM23 10h1v1h-1zM2 11h2v1H2zM8 12h1v1H8zM11 12h1v2h-1zM14 12h1v1h-1zM18 12h2v1h-2zM22 12h2v1h-2zM27 12h1v1h-1zM0 13h1v2H0zM4 13h1v1H4zM6 13h2v1H6zM13 13h1v2h-1zM16 13h2v1h-2zM20 13h1v1h-1zM25 13h1v1h-1zM9 15h1v1H9zM12 15h1v1h-1zM15 15h1v2h-1zM18 15h1v1h-1zM22 15h2v1h-2zM2 16h2v1H2zM5 16h1v1H5zM8 16h1v1H8zM11 16h1v1h-1zM20 16h1v2h-1zM26 16h1v1h-1zM0 17h1v1H0zM7 17h1v2H7zM13 17h1v1h-1zM17 17h2v1h-2zM23 17h1v1h-1zM25 17h2v1h-2zM9 18h1v1H9zM12 18h2v1h-2zM16 18h1v2h-1zM22 18h1v1h-1zM28 18h1v1h-1zM1 19h2v1H1zM4 19h1v1H4zM10 19h1v2h-1zM14 19h1v1h-1zM18 19h1v1h-1zM21 19h1v1h-1zM24 19h1v1h-1zM27 19h1v2h-1zM8 21h1v1H8zM12 21h1v1h-1zM15 21h2v1h-2zM19 21h1v1h-1zM22 21h2v1h-2zM25 21h1v1h-1zM9 22h2v1H9zM14 22h1v1h-1zM17 22h1v1h-1zM20 22h2v1h-2zM10 24h1v1h-1zM13 24h2v1h-3zM17 24h1v2h-1zM23 24h1v1h-1zM26 24h2v1h-2zM8 25h2v1H8zM12 25h1v1h-1zM16 25h1v1h-1zM19 25h1v1h-1zM22 25h1v1h-1zM25 25h1v1h-1zM9 27h1v1H9zM11 27h2v1h-2zM15 27h1v1h-1zM18 27h3v1h-3zM24 27h1v1h-1zM27 27h1v1h-1z" />
        </svg>
        <span className="text-[11px] font-mono font-extrabold tracking-wider text-black text-center break-all">
          {confirmationId}
        </span>
      </div>
    </div>
  );
};
