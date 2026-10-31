import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export type AlertType = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  type?: AlertType;
  variant?: AlertType | string;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  variant,
  title,
  message,
  children,
  action,
  onDismiss,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const alertType = (type || variant || 'info') as AlertType;

  const getAlertDetails = () => {
    switch (alertType) {
      case 'error':
        return {
          containerClass: 'bg-[var(--error-bg)] border-[var(--error-fg)]',
          titleClass: 'text-[var(--error-fg)]',
          icon: <AlertOctagon className="w-5 h-5 text-[var(--error-fg)] shrink-0 mt-0.5" aria-hidden="true" />,
          role: 'alert',
        };
      case 'warning':
        return {
          containerClass: 'bg-[var(--warning-bg)] border-[var(--warning-fg)]',
          titleClass: 'text-[var(--warning-fg)]',
          icon: <AlertTriangle className="w-5 h-5 text-[var(--warning-fg)] shrink-0 mt-0.5" aria-hidden="true" />,
          role: 'status',
        };
      case 'success':
        return {
          containerClass: 'bg-[var(--success-bg)] border-[var(--success-fg)]',
          titleClass: 'text-[var(--success-fg)]',
          icon: <CheckCircle2 className="w-5 h-5 text-[var(--success-fg)] shrink-0 mt-0.5" aria-hidden="true" />,
          role: 'status',
        };
      case 'info':
      default:
        return {
          containerClass: 'bg-[var(--info-bg)] border-[var(--info-fg)]',
          titleClass: 'text-[var(--info-fg)]',
          icon: <Info className="w-5 h-5 text-[var(--info-fg)] shrink-0 mt-0.5" aria-hidden="true" />,
          role: 'status',
        };
    }
  };

  const { containerClass, titleClass, icon, role } = getAlertDetails();

  return (
    <motion.div
      role={role}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={`flex items-start gap-3 p-4 border rounded-sm text-[var(--text)] ${containerClass} ${className}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold m-0 leading-snug ${titleClass}`}>
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm mt-1 mb-0 leading-relaxed text-[var(--text)]">
            {message}
          </p>
        )}
        {children && (
          <div className="text-sm mt-0.5 leading-relaxed text-[var(--text)]">
            {children}
          </div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
