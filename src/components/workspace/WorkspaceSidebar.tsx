"use client";

import { Heart, HeartHandshake, LayoutDashboard, MailCheck, Settings as SettingsIcon, ShieldCheck, UsersRound, X } from "lucide-react";
import type { Page } from "@/components/workspace/useWorkspace";

const NAV_ITEMS: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: UsersRound },
  { id: "matchfinder", label: "Match finder", icon: Heart },
  { id: "introductions", label: "Sent introductions", icon: MailCheck },
];

export function WorkspaceSidebar({
  page,
  onNavigate,
  email,
  matchmakerName,
  matchmakerInitials,
  introductionCount,
  sidebarOpen,
  onClose,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  email: string;
  matchmakerName: string;
  matchmakerInitials: string;
  introductionCount: number;
  sidebarOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {sidebarOpen && <button className="mobile-sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark"><HeartHandshake size={19} strokeWidth={1.8} /></span>
          <span>the date crew<small>MATCHMAKER OS</small></span>
          <button className="mobile-close-sidebar" aria-label="Close navigation" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              aria-current={page === id ? "page" : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "introductions" && introductionCount > 0 && <small>{introductionCount.toString().padStart(2, "0")}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">PREFERENCES</div>
        <nav className="sidebar-nav" aria-label="Preferences">
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            aria-current={page === "settings" ? "page" : undefined}
            onClick={() => onNavigate("settings")}
          >
            <SettingsIcon size={17} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-demo-card">
          <span className="sidebar-demo-icon"><ShieldCheck size={16} /></span>
          <div><strong>Demo environment</strong><small>Fictional sample data</small></div>
          <span className="sidebar-demo-dot" />
        </div>
        <button className="sidebar-profile" onClick={() => onNavigate("settings")} aria-label={`Account settings for ${email}`}>
          <span className="user-avatar">{matchmakerInitials}</span>
          <span className="sidebar-profile-copy"><strong>{matchmakerName}</strong><small>{email}</small></span>
          <SettingsIcon size={15} />
        </button>
      </aside>
    </>
  );
}
