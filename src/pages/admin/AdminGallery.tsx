import React, { useState, useEffect } from 'react';
import { Upload, Link2, Trash2, Calendar } from 'lucide-react';
import { adminGetAllGallery, adminSaveGalleryItem, adminDeleteGalleryItem, adminUploadGalleryImage, adminGetAllEvents } from '../../lib/api';
import type { DbGalleryItem, DbEvent } from '../../lib/api';
import { Alert } from '../../components/Alert';

export const AdminGallery: React.FC = () => {
  const [items, setItems] = useState<DbGalleryItem[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [gList, eList] = await Promise.all([
          adminGetAllGallery(),
          adminGetAllEvents()
        ]);
        if (active) {
          setItems(gList);
          setEvents(eList);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      setError('Selected image exceeds 5 MB limit. Please compress or choose a smaller file.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file format. Allowed formats: JPEG, PNG, WebP.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!altText.trim()) {
      setError('Alt Text is required for web accessibility.');
      return;
    }
    if (!caption.trim()) {
      setError('Caption is required to describe the event photo.');
      return;
    }

    let finalImagePath = imagePath.trim();

    setIsSubmitting(true);

    if (activeMode === 'upload') {
      if (!selectedFile) {
        setIsSubmitting(false);
        setError('Please select an image file to upload.');
        return;
      }

      const uploadRes = await adminUploadGalleryImage(selectedFile);
      if (!uploadRes.success || !uploadRes.path) {
        setIsSubmitting(false);
        setError(uploadRes.message || 'Image upload failed.');
        return;
      }
      finalImagePath = uploadRes.path;
    } else {
      if (!finalImagePath) {
        setIsSubmitting(false);
        setError('Please provide an image URL.');
        return;
      }
    }

    const ok = await adminSaveGalleryItem({
      image_path: finalImagePath,
      caption: caption.trim(),
      alt_text: altText.trim(),
      event_id: selectedEventId || null,
      published: true
    });

    setIsSubmitting(false);

    if (ok) {
      setSuccess('Photo added to gallery successfully.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setImagePath('');
      setCaption('');
      setAltText('');
      setSelectedEventId('');
      const updated = await adminGetAllGallery();
      setItems(updated);
    } else {
      setError('Failed to save gallery item.');
    }
  };

  const handleDelete = async (id: string, imagePathToDelete: string) => {
    if (!window.confirm('Delete this photo from gallery?')) return;
    const ok = await adminDeleteGalleryItem(id, imagePathToDelete);
    if (ok) {
      setSuccess('Photo deleted from gallery and storage.');
      const updated = await adminGetAllGallery();
      setItems(updated);
    } else {
      setError('Failed to delete gallery item.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="pb-3 border-b border-[var(--border)]">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
          Media Assets
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
          Photo Gallery Items
        </h1>
      </div>

      {success && (
        <Alert variant="success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleAdd} className="p-5 sm:p-6 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-body text-[var(--text-strong)] m-0">
            Add Photo to Gallery
          </h2>

          <div className="flex items-center gap-1 bg-[var(--bg)] p-1 border border-[var(--border)] rounded-sm text-xs font-mono">
            <button
              type="button"
              onClick={() => { setActiveMode('upload'); setError(null); }}
              className={`px-3 py-1 rounded-sm flex items-center gap-1.5 transition-all ${
                activeMode === 'upload'
                  ? 'bg-[var(--accent)] text-[#10002B] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Storage Upload</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('url'); setError(null); }}
              className={`px-3 py-1 rounded-sm flex items-center gap-1.5 transition-all ${
                activeMode === 'url'
                  ? 'bg-[var(--accent)] text-[#10002B] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Direct URL</span>
            </button>
          </div>
        </div>

        {activeMode === 'upload' ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-[var(--text-muted)] uppercase">
              Upload Image (Max 5 MB, JPEG / PNG / WebP / SVG) *
            </label>
            <div className="border-2 border-dashed border-[var(--border-strong)] rounded-md p-4 bg-[var(--bg)] flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-[var(--accent)] transition-colors">
              <input
                type="file"
                id="gallery-file-input"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                className="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-[var(--border)] file:bg-[var(--surface-raised)] file:text-[var(--text-strong)] file:cursor-pointer"
              />
              {previewUrl && (
                <div className="mt-2 w-full max-w-xs aspect-[4/3] rounded-sm overflow-hidden border border-[var(--border)]">
                  <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="cc-field">
            <label htmlFor="gal-url">Image URL / Path *</label>
            <input
              type="url"
              id="gal-url"
              required={activeMode === 'url'}
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              className="cc-input font-mono text-xs"
              placeholder="https://.../photo.webp"
            />
          </div>
        )}

        <div className="cc-field">
          <label htmlFor="gal-caption">Caption *</label>
          <input
            type="text"
            id="gal-caption"
            required
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="cc-input"
            placeholder="e.g. Hands-on coding session in Lab 304"
          />
        </div>

        <div className="cc-field">
          <label htmlFor="gal-alt">Alt Text (Accessibility) *</label>
          <input
            type="text"
            id="gal-alt"
            required
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="cc-input"
            placeholder="Describe what is taking place in the image for screen readers"
          />
        </div>

        <div className="cc-field">
          <label htmlFor="gal-event">Associated Event (Optional)</label>
          <select
            id="gal-event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="cc-input font-mono text-xs"
          >
            <option value="">None (General Club Activity)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({new Date(ev.starts_at).toLocaleDateString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cc-btn cc-btn--primary cc-btn--sm self-start"
        >
          {isSubmitting ? 'Uploading...' : 'Add to Gallery'}
        </button>
      </form>

      {loading ? (
        <div className="p-8 text-center font-mono text-xs text-[var(--text-muted)]">
          Loading gallery...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 border border-[var(--border)] rounded-sm bg-[var(--surface-1)] text-left flex flex-col gap-2">
          <div className="text-sm font-semibold text-[var(--text-strong)]">No gallery items uploaded yet</div>
          <div className="text-xs text-[var(--text-muted)]">Photos uploaded here will be displayed on the public Gallery page.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="p-3 bg-[var(--surface-1)] border border-[var(--border)] rounded-sm flex flex-col gap-2">
              <div className="w-full aspect-[4/3] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-sm overflow-hidden flex items-center justify-center">
                <img
                  src={item.image_path}
                  alt={item.alt_text}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="text-xs font-mono text-[var(--text-muted)] truncate" title={item.alt_text}>
                Alt: {item.alt_text}
              </div>

              {item.caption && (
                <div className="text-xs text-[var(--text-strong)] font-body line-clamp-2">
                  {item.caption}
                </div>
              )}

              {item.event_id && (
                <div className="text-[11px] font-mono text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--accent)]" />
                  <span>Linked to event</span>
                </div>
              )}

              <button
                type="button"
                aria-label={`Delete photo ${item.caption || item.alt_text}`}
                onClick={() => handleDelete(item.id, item.image_path)}
                className="mt-2 text-xs font-mono text-[var(--danger-text)] hover:underline flex items-center gap-1 self-start"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
