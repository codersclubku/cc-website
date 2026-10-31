function foldLine(line: string): string {
  const maxBytes = 75;
  if (line.length <= maxBytes) return line;

  const chunks: string[] = [];
  let remaining = line;

  chunks.push(remaining.slice(0, maxBytes));
  remaining = remaining.slice(maxBytes);

  while (remaining.length > 0) {
    chunks.push(' ' + remaining.slice(0, maxBytes - 1));
    remaining = remaining.slice(maxBytes - 1);
  }

  return chunks.join('\r\n');
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

function formatUtcDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateIcsContent(event: {
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  confirmationId?: string;
}): string {
  const dtStamp = formatUtcDate(new Date().toISOString());
  const dtStart = formatUtcDate(event.startsAt);
  const dtEnd = formatUtcDate(event.endsAt);
  const uid = event.confirmationId
    ? `cc-${event.confirmationId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-reg@codersclub.ku`
    : `cc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@codersclub.ku`;

  const descriptionWithId = event.confirmationId
    ? `${event.description}\n\nConfirmation ID: ${event.confirmationId}`
    : event.description;

  const rawLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coders Club//Kishkinda University//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(descriptionWithId)}`,
    `LOCATION:${escapeText(event.venue)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return rawLines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadIcsFile(event: {
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  confirmationId?: string;
}): void {
  const icsContent = generateIcsContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = event.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  link.setAttribute('download', `${safeName || 'event'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
