"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoStore, Profile } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";
import type { MatchResult } from "@/matching/scoring";

export type Page = "overview" | "customers" | "matchfinder" | "introductions" | "settings";

export interface PendingIntroduction {
  customer: Profile;
  candidate: Profile;
  match: MatchResult;
}

export interface ToastState {
  id: number;
  message: string;
  kind: "success" | "error";
}

const ASSESSMENT_MODE_KEY = "tdc-assessment-demo-mode";

/**
 * Workspace data and UI state.
 *
 * The server is the authorisation boundary, so this hook only caches the
 * scoped snapshot it receives. Mutations replace that snapshot with the
 * server's response instead of patching local state, which keeps two tabs and
 * a refresh consistent.
 */
export function useWorkspace() {
  const router = useRouter();
  const [store, setStore] = useState<DemoStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState<Page>("overview");
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [pendingIntroduction, setPendingIntroduction] = useState<PendingIntroduction | null>(null);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  // The brief wants the gender-specific demonstration rules to be a visible,
  // first-class part of scoring, so they start enabled. The toggle remains for
  // transparency and can be persisted per browser.
  const [assessmentDemoMode, setAssessmentDemoMode] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshStore = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const payload = await response.json() as DemoStore & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Your workspace could not be loaded.");
      setStore(payload);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Your workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const task = window.setTimeout(() => void refreshStore(), 0);
    return () => window.clearTimeout(task);
  }, [refreshStore]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      const saved = window.localStorage.getItem(ASSESSMENT_MODE_KEY);
      if (saved !== null) setAssessmentDemoMode(saved === "true");
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = useCallback((message: string, kind: ToastState["kind"] = "success") => {
    setToast({ id: Date.now(), message, kind });
  }, []);

  const performAction = useCallback(async (action: ActionPayload) => {
    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const payload = await response.json() as (DemoStore & { error?: string });
    if (response.status === 401) {
      router.replace("/login");
      throw new Error("Your session has expired.");
    }
    if (!response.ok) throw new Error(payload.error || "The action could not be saved.");
    setStore(payload);
    const messages: Record<ActionPayload["action"], string> = {
      stage: "Journey stage updated.",
      note: "Note saved to the customer timeline.",
      shortlist: "Shortlist updated.",
      dismiss: "Profile dismissed from recommendations.",
      restore: "Profile restored to recommendations.",
      send: "Introduction saved to the demo outbox. No email was sent.",
    };
    showToast(messages[action.action]);
  }, [router, showToast]);

  const navigate = useCallback((nextPage: Page) => {
    setPage(nextPage);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleAssessmentMode = useCallback((enabled: boolean) => {
    setAssessmentDemoMode(enabled);
    window.localStorage.setItem(ASSESSMENT_MODE_KEY, String(enabled));
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }, [router]);

  return {
    store,
    loading,
    loadError,
    page,
    navigate,
    refreshStore,
    selectedCustomer,
    openCustomer: setSelectedCustomer,
    closeCustomer: () => setSelectedCustomer(null),
    pendingIntroduction,
    setPendingIntroduction,
    closeIntroduction: () => setPendingIntroduction(null),
    showScoringGuide,
    openScoringGuide: () => setShowScoringGuide(true),
    closeScoringGuide: () => setShowScoringGuide(false),
    assessmentDemoMode,
    toggleAssessmentMode,
    performAction,
    signOut,
    toast,
    setToast,
    sidebarOpen,
    setSidebarOpen,
  };
}
