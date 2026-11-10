import {
  CircleNotchIcon,
  CheckCircleIcon,
  XCircleIcon,
  StopCircleIcon,
  WarningCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import type { RunStatus } from '../../src/schema';
export function Status({ status }: { status: RunStatus }) {
  const Icon =
    status === 'passed'
      ? CheckCircleIcon
      : status === 'failed'
        ? XCircleIcon
        : status === 'running'
          ? CircleNotchIcon
          : status === 'queued'
            ? ClockIcon
            : status === 'cancelled'
              ? StopCircleIcon
              : WarningCircleIcon;
  return (
    <span className={`status status-${status}`}>
      <Icon
        size={15}
        weight="bold"
        className={status === 'running' ? 'spin' : ''}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="error-notice" role="alert">
      <WarningCircleIcon size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
export function Loading({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <CircleNotchIcon size={20} className="spin" aria-hidden="true" />
      {label}
    </div>
  );
}
export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <MagnifyingGlassIcon size={17} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
