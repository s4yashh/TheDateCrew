"use client";

import { Menu } from "lucide-react";
import type { Page } from "@/components/workspace/useWorkspace";

const PAGE_TITLES: Record<Page, string> = {
  overview: "Overview",
  customers: "Customer directory",
  matchfinder: "Match finder",
  introductions: "Sent introductions",
  settings: "Settings",
};

export function WorkspaceTopbar({
  page,
  matchmakerName,
  matchmakerInitials,
  onOpenMenu,
  onOpenSettings,
}: {
  page: Page;
  matchmakerName: string;
  matchmakerInitials: string;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" aria-label="Open navigation" onClick={onOpenMenu}><Menu size={19} /></button>
        <span className="breadcrumb-root">Workspace</span>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">{PAGE_TITLES[page]}</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-demo-label"><span /> SAMPLE DATA</span>
        <span className="topbar-divider" />
        <button className="topbar-user" onClick={onOpenSettings}>
          <span className="user-avatar small">{matchmakerInitials}</span>
          <span>{matchmakerName}</span>
        </button>
      </div>
    </header>
  );
}
