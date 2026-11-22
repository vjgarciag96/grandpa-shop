import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({
  title,
  subtitle,
  className,
  onClose,
  children,
}: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!dialog.current?.contains(document.activeElement)) {
      closeButton.current?.focus();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialog.current?.querySelectorAll<
          HTMLButtonElement | HTMLInputElement | HTMLSelectElement
        >("button:enabled, input:enabled, select:enabled") ?? [],
      );
      // A native radio group has one tab stop, even when it has many options.
      const radio =
        controls.find(
          (control) =>
            control instanceof HTMLInputElement &&
            control.type === "radio" &&
            control.checked,
        ) ??
        controls.find(
          (control) =>
            control instanceof HTMLInputElement && control.type === "radio",
        );
      const tabStops = controls.filter(
        (control) =>
          !(control instanceof HTMLInputElement && control.type === "radio") ||
          control === radio,
      );
      const first = tabStops[0];
      const last = tabStops.at(-1);
      const active = document.activeElement;
      if (
        !dialog.current?.contains(active) ||
        active === (event.shiftKey ? first : last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={dialog}
        className={className ? `dialog ${className}` : "dialog"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog__head">
          <div>
            {subtitle && <p className="dialog__subtitle">{subtitle}</p>}
            <h2>{title}</h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            className="dialog__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
