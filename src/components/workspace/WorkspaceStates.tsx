"use client";

import { X } from "lucide-react";
import type { ToastState } from "@/components/workspace/useWorkspace";

export function WorkspaceLoading() {
  return (
    <div className="loading-state" aria-label="Loading workspace">
      <span className="loading-spinner" />
      <div><strong>Opening your workspace</strong><span>Gathering your customer notes and match recommendations…</span></div>
      <div className="loading-skeleton-grid"><i /><i /><i /><i /></div>
      <i className="loading-skeleton-wide" />
    </div>
  );
}

export function WorkspaceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="workspace-error">
      <span className="error-mark">!</span>
      <p className="eyebrow">WORKSPACE UNAVAILABLE</p>
      <h1>Let’s try that again.</h1>
      <p>{message}</p>
      <button className="button button-primary" onClick={onRetry}>Retry loading workspace</button>
    </section>
  );
}

export function WorkspaceToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} aria-live="polite">
      <span className="toast-check">{toast.kind === "success" ? "✓" : "!"}</span>
      {toast.message}
      <button onClick={onDismiss} aria-label="Dismiss notification"><X size={14} /></button>
    </div>
  );
}
