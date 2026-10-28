"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Mail, Search, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar, EmptyState } from "@/components/ui";
import { profileName } from "@/domain/types";
import type { DemoStore, Introduction } from "@/domain/types";

function IntroductionDetails({ introduction, store, onClose }: { introduction: Introduction; store: DemoStore; onClose: () => void }) {
  const customer = store.profiles.find((profile) => profile.id === introduction.customerId);
  const candidate = store.profiles.find((profile) => profile.id === introduction.candidateId);

  return (
    <Modal title="Introduction details" eyebrow="MOCK OUTBOX RECORD" onClose={onClose}>
      <div className="introduction-detail-body">
        <div className="outbox-alert">
          <Check size={15} />
          <div>
            <strong>{introduction.status}</strong>
            <span>Created {new Date(introduction.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</span>
          </div>
        </div>
        <div className="introduction-recipient">
          <small>PROPOSED RECIPIENT</small>
          <strong>{introduction.recipient}</strong>
          <span>Synthetic demo address · no message was sent</span>
        </div>
        <div className="introduction-pair-card">
          {customer && (
            <div>
              <Avatar profile={customer} />
              <span><strong>{profileName(customer)}</strong><small>Assigned customer</small></span>
            </div>
          )}
          <ArrowUpRight size={17} />
          {candidate && (
            <div>
              <Avatar profile={candidate} />
              <span>
                <strong>{profileName(candidate)}</strong>
                <small>{candidate.profession || "Profession not provided"} · {candidate.city || "Location not provided"}</small>
              </span>
            </div>
          )}
        </div>
        <div className="introduction-message">
          <div><span>MESSAGE DRAFT</span><span>Human reviewed</span></div>
          <p>{introduction.introText}</p>
        </div>
        <p className="detail-privacy-note"><ShieldCheck size={13} /> This record is private demo data. No real email service is configured.</p>
      </div>
    </Modal>
  );
}

export function Introductions({ store }: { store: DemoStore }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Introduction | null>(null);

  const introductions = useMemo(() => store.introductions.filter((item) => {
    const client = store.profiles.find((profile) => profile.id === item.customerId);
    const candidate = store.profiles.find((profile) => profile.id === item.candidateId);
    const query = search.trim().toLowerCase();
    return !query
      || [client && profileName(client), candidate && profileName(candidate), item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [search, store.introductions, store.profiles]);

  return (
    <div className="page-stack introductions-page">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">THE OUTBOX <span className="eyebrow-divider">/</span> SIMULATED ONLY</p>
          <h1>Sent introductions<span className="title-period">.</span></h1>
          <p className="welcome-subtitle">A quiet record of connections you’ve chosen to make.</p>
        </div>
        <div className="directory-total">
          <span className="metric-icon"><Mail size={17} /></span>
          <div><strong>{store.introductions.length.toString().padStart(2, "0")}</strong><small>demo introductions</small></div>
        </div>
      </section>

      <div className="outbox-alert">
        <ShieldCheck size={16} />
        <div>
          <strong>Nothing leaves this workspace.</strong>
          <span>Every message is simulated and stored only in the demo outbox. No email provider is connected.</span>
        </div>
      </div>

      <section className="panel outbox-panel">
        <div className="outbox-toolbar">
          <div>
            <p className="eyebrow">INTRODUCTION HISTORY</p>
            <h2>{introductions.length} {introductions.length === 1 ? "record" : "records"}</h2>
          </div>
          <label className="search-field">
            <Search size={15} />
            <input aria-label="Search introductions" placeholder="Search a name…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        {introductions.length ? (
          <div className="outbox-list">
            {introductions.map((item) => {
              const customer = store.profiles.find((profile) => profile.id === item.customerId);
              const candidate = store.profiles.find((profile) => profile.id === item.candidateId);
              if (!customer || !candidate) return null;
              return (
                <article className="outbox-row" key={item.id}>
                  <div className="outbox-pair">
                    <div className="outbox-avatars"><Avatar profile={customer} size="sm" /><Avatar profile={candidate} size="sm" /></div>
                    <div className="outbox-names">
                      <strong>{profileName(customer)} <span>+</span> {profileName(candidate)}</strong>
                      <small>{candidate.city || "Location not provided"} · {candidate.profession || "Profession not provided"}</small>
                    </div>
                  </div>
                  <div className="outbox-recipient"><small>MOCK RECIPIENT</small><span>{item.recipient}</span></div>
                  <div className="outbox-status">
                    <span><Check size={13} /> {item.status}</span>
                    <time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</time>
                  </div>
                  <button className="icon-button" aria-label={`View introduction to ${profileName(candidate)}`} onClick={() => setSelected(item)}>
                    <ChevronRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No introductions here"
            detail={search ? "Try a different name." : "Send a match from the Match Finder to create your first simulated introduction."}
          />
        )}

        <footer className="outbox-footer">
          <span><span className="sent-chip"><Check size={12} /> Sent · Demo</span> Every record is visible only to the matchmaker.</span>
          <span>Mock outbox · no delivery attempted</span>
        </footer>
      </section>

      {selected && <IntroductionDetails introduction={selected} store={store} onClose={() => setSelected(null)} />}
    </div>
  );
}
