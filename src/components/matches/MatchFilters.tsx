import { ArrowDownWideNarrow, ChevronDown, RefreshCw, Search, X } from "lucide-react";

export interface MatchFilterState {
  search: string;
  city: string;
  profession: string;
  verifiedOnly: boolean;
  minimumScore: string;
  sortOrder: string;
}

export function MatchFilters({
  filters,
  cities,
  professions,
  showFilters,
  onToggleFilters,
  onChange,
  onReset,
  onRefresh,
}: {
  filters: MatchFilterState;
  cities: string[];
  professions: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onChange: <Key extends keyof MatchFilterState>(key: Key, value: MatchFilterState[Key]) => void;
  onReset: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="match-filter-row">
        <label className="search-field match-search">
          <Search size={15} />
          <input
            aria-label="Search match candidates"
            placeholder="Search profiles…"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
          />
          {filters.search && (
            <button className="search-clear" aria-label="Clear match search" onClick={() => onChange("search", "")}><X size={13} /></button>
          )}
        </label>
        <button className={`filter-toggle ${showFilters ? "active" : ""}`} onClick={onToggleFilters}>
          <ArrowDownWideNarrow size={15} /> Filters {showFilters ? <X size={13} /> : <ChevronDown size={13} />}
        </button>
        <label className="sort-match-label">
          <span>Sort by</span>
          <select aria-label="Sort recommendations" value={filters.sortOrder} onChange={(event) => onChange("sortOrder", event.target.value)}>
            <option>Highest score</option>
            <option>Lowest score</option>
          </select>
        </label>
        <button className="refresh-button" onClick={onRefresh}><RefreshCw size={14} /> Refresh</button>
      </div>

      {showFilters && (
        <div className="advanced-match-filters">
          <label>City
            <select value={filters.city} onChange={(event) => onChange("city", event.target.value)}>
              <option>All cities</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Profession
            <select value={filters.profession} onChange={(event) => onChange("profession", event.target.value)}>
              <option>All professions</option>
              {professions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Minimum score
            <select value={filters.minimumScore} onChange={(event) => onChange("minimumScore", event.target.value)}>
              <option>Any score</option>
              <option value="50">50+</option>
              <option value="65">65+</option>
              <option value="80">80+</option>
            </select>
          </label>
          <label className="verified-filter">
            <input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => onChange("verifiedOnly", event.target.checked)} /> Verified profiles only
          </label>
          <button className="text-button" onClick={onReset}>Reset filters</button>
        </div>
      )}
    </>
  );
}
