import { categories } from "../data/properties";
import type { Filters, SortOrder } from "../lib/property-search";

export function ResultsToolbar({ filters, sort, favouritesOnly, savedCount, onFilters, onSort, onFavourites, onReset }: {
  filters: Filters; sort: SortOrder; favouritesOnly: boolean; savedCount: number;
  onFilters: (filters: Filters) => void; onSort: (sort: SortOrder) => void; onFavourites: () => void; onReset: () => void;
}) {
  return <div className="results-controls">
    <div className="results-toolbar">
      <label>Listing purpose<select value={filters.mode} onChange={e => onFilters({ ...filters, mode: e.target.value as Filters["mode"], budget: "", type: "" })}><option value="">All listings</option>{["Buy", "Rent", "Plot / Land", "Commercial"].map(m => <option key={m}>{m}</option>)}</select></label>
      <label>Category<select value={filters.type} onChange={e => onFilters({ ...filters, type: e.target.value })}><option value="">All property types</option>{categories.filter(c => c.name !== "Rental Homes" && (filters.mode !== "Plot / Land" || c.name === "Residential Plots") && (filters.mode !== "Commercial" || c.name === "Commercial Properties")).map(c => <option key={c.name}>{c.name}</option>)}</select></label>
      <label>Sort by<select value={sort} onChange={e => onSort(e.target.value as SortOrder)}><option value="recommended">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
      <button className={`filter-button ${favouritesOnly ? "active" : ""}`} aria-pressed={favouritesOnly} onClick={onFavourites}>Favourites ({savedCount})</button>
      <button className="filter-button" onClick={onReset}>Clear all filters</button>
    </div>
    <p className="filter-summary">{filters.mode || "All listing purposes"} · {filters.city.trim() || "All cities"} · {filters.type || "All categories"}{filters.budget && ` · Up to ₹ ${Number(filters.budget).toLocaleString("en-IN")}${filters.mode === "Rent" ? " / month" : ""}`}{favouritesOnly && " · Saved properties only"}</p>
    {sort !== "recommended" && <p className="sort-note">Sorted by displayed amount. Rental amounts are per month; sale amounts are total prices. Choose Buy or Rent to compare like for like.</p>}
  </div>;
}
