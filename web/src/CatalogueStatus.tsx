export function SearchIcon() {
  return <span className="catalogue__magnifier" aria-hidden="true" />;
}

export function RetryMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="catalogue__message">
      <strong role="alert">{message}</strong>
      <button
        type="button"
        className="control control--tonal"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}
