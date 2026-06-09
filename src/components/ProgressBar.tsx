interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-track" aria-label="Upload progress">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}
