"use client";

import { useState } from "react";
import { ArrowDownUp, ChevronLeft, ChevronRight, Search, SlidersHorizontal, UsersRound, X } from "lucide-react";
import type { Profile } from "@/domain/types";
import { getAge, profileName } from "@/domain/types";
import { Avatar, Completeness, StagePill, VerificationPill } from "@/components/ui";

const PAGE_SIZE = 10;
type SortKey = "name" | "age" | "activity" | "completeness";

export function Customers({ profiles, onOpen }: { profiles: Profile[]; onOpen: (profile: Profile) => void }) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All stages");
  const [city, setCity] = useState("All cities");
  const [maritalStatus, setMaritalStatus] = useState("All statuses");
  const [gender, setGender] = useState("All genders");
  const [verification, setVerification] = useState("All verification");
  const [sort, setSort] = useState<SortKey>("activity");
  const [page, setPage] = useState(1);
  const clients = profiles.filter((profile) => profile.assigned);
  const stages = Array.from(new Set(clients.map((profile) => profile.stage))).sort();
  const cities = Array.from(new Set(clients.map((profile) => profile.city).filter((value): value is string => Boolean(value)))).sort();
  const hasFilters = search || stage !== "All stages" || city !== "All cities" || maritalStatus !== "All statuses" || gender !== "All genders" || verification !== "All verification";

  const filtered = (() => {
    const query = search.trim().toLowerCase();
    return clients.filter((profile) => {
      const searchable = [profile.firstName, profile.lastName, profile.city, profile.profession].filter(Boolean).join(" ").toLowerCase();
      return (!query || searchable.includes(query))
        && (stage === "All stages" || profile.stage === stage)
        && (city === "All cities" || profile.city === city)
        && (maritalStatus === "All statuses" || profile.maritalStatus === maritalStatus)
        && (gender === "All genders" || profile.gender === gender)
        && (verification === "All verification" || profile.verification === verification);
    }).sort((left, right) => {
      if (sort === "name") return profileName(left).localeCompare(profileName(right));
      if (sort === "age") return (getAge(left.dateOfBirth) ?? 999) - (getAge(right.dateOfBirth) ?? 999);
      if (sort === "completeness") return right.profileCompleteness - left.profileCompleteness;
      return right.lastActivityAt.localeCompare(left.lastActivityAt);
    });
  })();

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setSearch(""); setStage("All stages"); setCity("All cities"); setMaritalStatus("All statuses"); setGender("All genders"); setVerification("All verification"); setPage(1);
  }

  return <div className="page-stack directory-page">
    <section className="page-heading-row"><div><p className="eyebrow">YOUR PEOPLE <span className="eyebrow-divider">/</span> {clients.length} ASSIGNED</p><h1>Customer directory<span className="title-period">.</span></h1><p className="welcome-subtitle">Every good introduction starts with knowing the person.</p></div>
      <div className="directory-total"><span className="metric-icon"><UsersRound size={17} /></span><div><strong>{filtered.length}</strong><small>customers shown</small></div></div>
    </section>

    <section className="panel directory-panel">
      <div className="directory-toolbar">
        <label className="search-field"><Search size={16} /><input aria-label="Search customers by name, city, or profession" placeholder="Search name, city, profession…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />{search && <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}</label>
        <span className="toolbar-divider" />
        <div className="filter-label"><SlidersHorizontal size={14} /> FILTERS</div>
        <select aria-label="Filter by journey stage" value={stage} onChange={(event) => { setStage(event.target.value); setPage(1); }}><option>All stages</option>{stages.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter by city" value={city} onChange={(event) => { setCity(event.target.value); setPage(1); }}><option>All cities</option>{cities.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter by marital status" value={maritalStatus} onChange={(event) => { setMaritalStatus(event.target.value); setPage(1); }}><option>All statuses</option>{["Never married", "Divorced", "Widowed"].map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter by gender" value={gender} onChange={(event) => { setGender(event.target.value); setPage(1); }}><option>All genders</option><option value="woman">Woman</option><option value="man">Man</option></select>
        <select aria-label="Filter by verification" value={verification} onChange={(event) => { setVerification(event.target.value); setPage(1); }}><option>All verification</option>{["Verified", "Pending", "Unverified"].map((item) => <option key={item}>{item}</option>)}</select>
        {hasFilters && <button className="clear-filters" onClick={clearFilters}>Clear</button>}
      </div>

      <div className="directory-table-wrap"><table className="directory-table">
        <thead><tr><th>Customer</th><th>Age · Gender</th><th>City</th><th>Marital status</th><th>Verification</th><th>Journey</th><th>Profile</th><th><label className="sort-heading">Last active <ArrowDownUp size={12} /><select aria-label="Sort customers" value={sort} onChange={(event) => { setSort(event.target.value as SortKey); setPage(1); }}><option value="activity">Last active</option><option value="name">Name</option><option value="age">Age</option><option value="completeness">Completeness</option></select></label></th></tr></thead>
        <tbody>{visible.map((profile) => {
          const age = getAge(profile.dateOfBirth);
          return <tr key={profile.id} onClick={() => onOpen(profile)} className="directory-row">
            <td><div className="customer-cell"><Avatar profile={profile} size="sm" /><span><button className="customer-name-button" onClick={(event) => { event.stopPropagation(); onOpen(profile); }}>{profileName(profile)}</button><small>{profile.profession || "Profession not provided"}</small></span></div></td>
            <td><span className="table-main">{age === null ? "—" : age}</span><span className="table-sub">{profile.gender === "woman" ? "Woman" : profile.gender === "man" ? "Man" : "Not provided"}</span></td>
            <td><span className="table-main">{profile.city || "Not provided"}</span><span className="table-sub">{profile.state || "India"}</span></td>
            <td><span className="table-main">{profile.maritalStatus || "Not provided"}</span></td>
            <td><VerificationPill state={profile.verification} /></td>
            <td><StagePill stage={profile.stage} /></td>
            <td><Completeness value={profile.profileCompleteness} /></td>
            <td><span className="table-main">{new Date(profile.lastActivityAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span><span className="table-sub">{new Date(profile.lastActivityAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></td>
          </tr>;
        })}</tbody>
      </table>{visible.length === 0 && <div className="table-empty"><UsersRound size={22} /><strong>No customers found</strong><span>Try a different search or clear your filters.</span>{hasFilters && <button className="text-button" onClick={clearFilters}>Clear all filters</button>}</div>}</div>

      <footer className="directory-footer"><span>Showing <strong>{filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong> assigned customers</span>
        <div className="pagination"><button className="icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button><span>Page <strong>{page}</strong> of {pageCount}</span><button className="icon-button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight size={16} /></button></div>
      </footer>
    </section>
    <p className="privacy-note">Private internal workspace · Sensitive contact details are only shown in customer detail views.</p>
  </div>;
}
