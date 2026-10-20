// Run with: npm run test:search
// Transpile the actual data and filter modules so checks exercise production logic.
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function("exports", source)(exports);
  return exports;
}
const { properties } = load("app/data/properties.ts");
const { filterProperties, sortProperties, emptyFilters } = load("app/lib/property-search.ts");
const find = changes => filterProperties(properties, { ...emptyFilters, ...changes });
assert.equal(new Set(properties.map(p => p.id)).size, properties.length);
for (const city of ["Bhubaneswar", "Cuttack", "Puri", "Bengaluru", "Hyderabad", "Delhi NCR"]) {
  assert.ok(find({ city }).length > 0, `Missing ${city}`);
}
for (const type of ["Flats / Apartments", "Independent Houses", "Villas", "Residential Plots", "Commercial Properties"]) {
  assert.ok(find({ type }).length > 0, `Missing ${type}`);
}
for (const p of properties) {
  assert.ok(p.value > 0 && p.areaSqFt > 0 && p.description && p.image && p.location);
  assert.equal(p.bedrooms === null, ["Residential Plots", "Commercial Properties"].includes(p.type));
  assert.equal(typeof p.verified, "boolean");
}
assert.deepEqual(find({ mode: "Buy", city: "  pAtIa ", type: "Flats / Apartments", budget: "8500000" }).map(p => p.id), [1]);
assert.equal(find({ mode: "Buy", city: "Patia", budget: "8499999" }).length, 0);
assert.ok(find({ mode: "Rent" }).every(p => p.status === "Rent"));
assert.ok(find({ mode: "Buy" }).every(p => p.status === "Buy"));
assert.ok(find({ mode: "Plot / Land" }).every(p => p.type === "Residential Plots"));
assert.ok(find({ mode: "Commercial" }).every(p => p.type === "Commercial Properties"));
assert.deepEqual(find({ mode: "Rent", city: "Puri", budget: "20000" }).map(p => p.id), [11]);
assert.equal(find({ city: "nonexistent city" }).length, 0);
assert.equal(find({ mode: "Rent", type: "Residential Plots" }).length, 0);
assert.equal(find({}).length, properties.length);
const ids = properties.map(p => p.id);
for (const direction of ["price-asc", "price-desc"]) {
  const sorted = sortProperties(properties, direction);
  assert.equal(sorted.length, properties.length);
  assert.ok(sorted.every((p, i) => i === 0 || (direction === "price-asc" ? sorted[i - 1].value <= p.value : sorted[i - 1].value >= p.value)));
}
assert.deepEqual(properties.map(p => p.id), ids, "Sorting must not mutate source data");
assert.deepEqual(sortProperties(properties, "recommended").map(p => p.id), ids);
const decoder = new TextDecoder("utf-8", { fatal: true });
function checkUtf8(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "test-results", "playwright-report"].includes(item.name)) continue;
    const file = `${dir}/${item.name}`;
    if (item.isDirectory()) checkUtf8(file);
    else if (/\.(tsx?|css|mjs|json|md|svg|rules|ya?ml)$/.test(file) || item.name === ".env.example" || item.name === ".gitignore") assert.ok(!decoder.decode(fs.readFileSync(file)).includes("\uFFFD"), `Invalid text in ${file}`);
  }
}
checkUtf8(".");
console.log(`Passed: ${properties.length} complete sample listings, city/category/mode filters, combined location/budget filters, empty/reset results, immutable price sorting, and UTF-8 validation.`);
