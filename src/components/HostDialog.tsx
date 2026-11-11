import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

export function HostDialog({
  label,
  onDismiss,
  children,
}: {
  label: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal-backdrop"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      {children}
    </dialog>
  );
}
