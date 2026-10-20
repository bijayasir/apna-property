import type { Mode, Property } from "../data/properties";
export type Filters = { mode: Mode | ""; city: string; type: string; budget: string };
export type SortOrder = "recommended" | "price-asc" | "price-desc";
export const emptyFilters: Filters = { mode: "", city: "", type: "", budget: "" };
export function filterProperties(list: Property[], filters: Filters) {
  const query = filters.city.trim().toLocaleLowerCase("en-IN");
  return list.filter(p => (!query || p.location.toLocaleLowerCase("en-IN").includes(query))
    && (!filters.type || p.type === filters.type)
    && (!filters.budget || p.value <= Number(filters.budget))
    && (!filters.mode || (filters.mode === "Buy" ? p.status === "Buy" : filters.mode === "Rent" ? p.status === "Rent" : filters.mode === "Plot / Land" ? p.type === "Residential Plots" : p.type === "Commercial Properties")));
}
export function sortProperties(list: Property[], sort: SortOrder) {
  return sort === "recommended" ? [...list] : [...list].sort((a, b) => (sort === "price-asc" ? a.value - b.value : b.value - a.value) || a.id - b.id);
}
