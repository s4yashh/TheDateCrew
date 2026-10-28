"use client";

import { ShieldCheck } from "lucide-react";
import { CustomerDetail } from "@/components/customer/CustomerDetail";
import { Customers } from "@/components/Customers";
import { Introductions } from "@/components/Introductions";
import { Matches } from "@/components/matches/Matches";
import { ScoringGuide } from "@/components/matches/ScoringGuide";
import { Overview } from "@/components/overview/Overview";
import { SendMatchDialog } from "@/components/SendMatchDialog";
import { Settings } from "@/components/Settings";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/workspace/WorkspaceTopbar";
import { WorkspaceError, WorkspaceLoading, WorkspaceToast } from "@/components/workspace/WorkspaceStates";
import { useWorkspace } from "@/components/workspace/useWorkspace";

/**
 * Authenticated application shell.
 *
 * All data flows through `useWorkspace`; every page receives the scoped
 * snapshot and the same action dispatcher. Layout chrome lives in its own
 * components so this file stays focused on composition.
 */
export function AppWorkspace({
  email,
  matchmaker,
  aiConfigured,
  persistence,
}: {
  email: string;
  matchmaker: { name: string; initials: string };
  aiConfigured: boolean;
  persistence: string;
}) {
  const workspace = useWorkspace();
  const { store, loading, loadError, page, navigate } = workspace;

  return (
    <div className={`app-shell ${workspace.sidebarOpen ? "sidebar-is-open" : ""}`}>
      <WorkspaceSidebar
        page={page}
        onNavigate={navigate}
        email={email}
        matchmakerName={matchmaker.name}
        matchmakerInitials={matchmaker.initials}
        introductionCount={store?.introductions.length ?? 0}
        sidebarOpen={workspace.sidebarOpen}
        onClose={() => workspace.setSidebarOpen(false)}
      />

      <div className="main-column">
        <WorkspaceTopbar
          page={page}
          matchmakerName={matchmaker.name}
          matchmakerInitials={matchmaker.initials}
          onOpenMenu={() => workspace.setSidebarOpen(true)}
          onOpenSettings={() => navigate("settings")}
        />
        <main className="main-content">
          {loading && !store ? (
            <WorkspaceLoading />
          ) : loadError && !store ? (
            <WorkspaceError message={loadError} onRetry={() => void workspace.refreshStore()} />
          ) : store ? (
            <>
              {page === "overview" && (
                <Overview
                  store={store}
                  matchmakerName={matchmaker.name}
                  onNavigate={(nextPage) => navigate(nextPage)}
                  onOpenCustomer={workspace.openCustomer}
                />
              )}
              {page === "customers" && <Customers profiles={store.profiles} onOpen={workspace.openCustomer} />}
              {page === "matchfinder" && (
                <Matches
                  store={store}
                  onAction={workspace.performAction}
                  onSend={(candidate, match, customer) => workspace.setPendingIntroduction({ candidate, match, customer })}
                  assessmentDemoMode={workspace.assessmentDemoMode}
                  onShowHowItWorks={workspace.openScoringGuide}
                />
              )}
              {page === "introductions" && <Introductions store={store} />}
              {page === "settings" && (
                <Settings
                  email={email}
                  matchmakerName={matchmaker.name}
                  aiConfigured={aiConfigured}
                  persistence={persistence}
                  assessmentDemoMode={workspace.assessmentDemoMode}
                  onAssessmentModeChange={workspace.toggleAssessmentMode}
                  onSignOut={workspace.signOut}
                />
              )}
            </>
          ) : (
            <WorkspaceLoading />
          )}
        </main>
        <footer className="app-footer">
          <span>© 2026 The Date Crew</span>
          <span><ShieldCheck size={13} /> Private matchmaker workspace · Sample data only</span>
          <span>v2.0</span>
        </footer>
      </div>

      {store && workspace.selectedCustomer && (
        <CustomerDetail
          profile={store.profiles.find((profile) => profile.id === workspace.selectedCustomer?.id) ?? workspace.selectedCustomer}
          store={store}
          matchmakerName={matchmaker.name}
          onClose={workspace.closeCustomer}
          onAction={workspace.performAction}
        />
      )}
      {workspace.pendingIntroduction && (
        <SendMatchDialog
          customer={workspace.pendingIntroduction.customer}
          candidate={workspace.pendingIntroduction.candidate}
          match={workspace.pendingIntroduction.match}
          onClose={workspace.closeIntroduction}
          onConfirm={async (introText) => {
            if (!workspace.pendingIntroduction) return;
            await workspace.performAction({
              action: "send",
              customerId: workspace.pendingIntroduction.customer.id,
              candidateId: workspace.pendingIntroduction.candidate.id,
              introText,
            });
            workspace.closeIntroduction();
            navigate("introductions");
          }}
        />
      )}
      {workspace.showScoringGuide && (
        <ScoringGuide
          onClose={workspace.closeScoringGuide}
          assessmentDemoMode={workspace.assessmentDemoMode}
          onAssessmentModeChange={workspace.toggleAssessmentMode}
        />
      )}
      {workspace.toast && <WorkspaceToast toast={workspace.toast} onDismiss={() => workspace.setToast(null)} />}
    </div>
  );
}
