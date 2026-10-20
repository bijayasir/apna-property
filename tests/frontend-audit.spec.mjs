import { test, expect } from "@playwright/test";
import fs from "node:fs";
import ts from "typescript";

const exports = {};
new Function("exports", ts.transpileModule(fs.readFileSync("app/data/properties.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(exports);
const { properties, cities, categories } = exports;
const cards = page => page.locator(".property-card");
const toolbar = page => page.locator(".results-toolbar");
const modal = page => page.getByRole("dialog");
const allListings = async page => { await page.getByRole("button", { name: "Explore all properties" }).click(); await expect(cards(page)).toHaveCount(properties.length); };
async function verifyRenderedImages(page) {
  const failures = await page.locator("img").evaluateAll(async images => {
    const results = await Promise.all(images.map(async image => {
      image.loading = "eager";
      try { await image.decode(); return image.naturalWidth > 0 ? null : image.src; }
      catch { return image.src; }
    }));
    return results.filter(Boolean);
  });
  expect(failures).toEqual([]);
}

test.beforeEach(async ({ page }) => { await page.goto("/", { waitUntil: "domcontentloaded" }); });

test("homepage renders and all purpose tabs filter the correct listings", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(cards(page)).toHaveCount(4);
  for (const mode of ["Buy", "Rent", "Plot / Land", "Commercial"]) {
    await page.locator(".search-tabs").getByRole("button", { name: mode, exact: true }).click();
    const expected = properties.filter(p => mode === "Buy" ? p.status === "Buy" : mode === "Rent" ? p.status === "Rent" : p.type === (mode === "Commercial" ? "Commercial Properties" : "Residential Plots"));
    await expect(cards(page)).toHaveCount(expected.length);
    await expect(page.locator(".search-tabs .active")).toHaveText(mode);
    for (const p of expected) await expect(cards(page).filter({ has: page.getByRole("heading", { name: p.title, exact: true }) })).toHaveCount(1);
  }
});

test("combined location, type, budget, form submission, Enter and empty/reset states", async ({ page }) => {
  await page.getByLabel("CITY / LOCATION", { exact: true }).fill("  pAtIa  ");
  await page.locator(".search-fields").getByLabel("PROPERTY TYPE").selectOption("Flats / Apartments");
  await page.locator(".search-fields").getByLabel("BUDGET").selectOption("10000000");
  await page.getByRole("button", { name: "Search Properties", exact: true }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText("Sunlit family apartment in Patia");
  await page.locator(".search-fields").getByLabel("BUDGET").selectOption("5000000");
  await page.getByLabel("CITY / LOCATION", { exact: true }).press("Enter");
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator(".empty-state")).toContainText("No sample listings match");
  await page.getByRole("button", { name: "Reset search", exact: true }).click();
  await expect(cards(page)).toHaveCount(properties.length);
  await expect(page.getByLabel("CITY / LOCATION", { exact: true })).toHaveValue("");
  await page.locator(".search-tabs").getByRole("button", { name: "Rent", exact: true }).click();
  await page.getByLabel("CITY / LOCATION", { exact: true }).fill("Puri");
  await page.locator(".search-fields").getByLabel("BUDGET").selectOption("20000");
  await page.getByRole("button", { name: "Search Properties", exact: true }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText("₹ 16,000");
  await expect(cards(page).first()).toContainText("/ month");
  await page.getByLabel("CITY / LOCATION", { exact: true }).fill("Unknown City");
  await page.getByRole("button", { name: "Search Properties", exact: true }).click();
  await expect(cards(page)).toHaveCount(0);
});

test("popular searches, all category buttons and every city link work", async ({ page }) => {
  for (const [label, city, type] of [["Flats in Bhubaneswar", "Bhubaneswar", "Flats / Apartments"], ["Plots in Cuttack", "Cuttack", "Residential Plots"], ["Homes in Bengaluru", "Bengaluru", ""]]) {
    await page.getByRole("button", { name: label }).click();
    await expect(cards(page)).toHaveCount(properties.filter(p => p.city === city && p.status === "Buy" && (!type || p.type === type)).length);
  }
  for (const c of categories) {
    await page.locator(".category-grid").getByRole("button", { name: c.name, exact: true }).click();
    const expected = properties.filter(p => c.name === "Rental Homes" ? p.status === "Rent" : p.type === c.name && (c.name === "Commercial Properties" || p.status === "Buy"));
    await expect(cards(page)).toHaveCount(expected.length);
  }
  for (const city of cities) {
    await page.locator(".city-grid").getByRole("button", { name: new RegExp(`^${city.name}`) }).click();
    await expect(cards(page)).toHaveCount(properties.filter(p => p.city === city.name).length);
    await expect(page.getByLabel("CITY / LOCATION", { exact: true })).toHaveValue(city.name);
  }
});

test("all-listing selection stays in sync with homepage tabs and subsequent searches", async ({ page }) => {
  await allListings(page);
  await expect(page.locator(".search-tabs .active")).toHaveCount(0);
  await page.getByRole("button", { name: "Search Properties", exact: true }).click();
  await expect(cards(page)).toHaveCount(properties.length);
  await toolbar(page).getByRole("combobox", { name: "Listing purpose", exact: true }).selectOption("Rent");
  await expect(page.locator(".search-tabs .active")).toHaveText("Rent");
  await toolbar(page).getByRole("combobox", { name: "Listing purpose", exact: true }).selectOption("");
  await expect(page.locator(".search-tabs .active")).toHaveCount(0);
});

test("back to featured clears stale search values but preserves saved properties", async ({ page }) => {
  await page.getByRole("button", { name: "Flats in Bhubaneswar" }).click();
  await cards(page).first().getByRole("button", { name: /^Save / }).click();
  await page.getByRole("button", { name: "Back to featured" }).click();
  await expect(cards(page)).toHaveCount(4);
  await expect(page.getByLabel("CITY / LOCATION", { exact: true })).toHaveValue("");
  await expect(page.locator(".search-tabs .active")).toHaveText("Buy");
  await expect(page.locator(".search-fields").getByLabel("PROPERTY TYPE")).toHaveValue("");
  await expect(page.locator(".search-fields").getByLabel("BUDGET")).toHaveValue("");
  await allListings(page);
  await expect(page.getByRole("button", { name: "Favourites (1)", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page.getByRole("button", { name: "Favourites (1)", exact: true })).toBeVisible();
});

test("keyboard skip link, mobile menu Escape and modal focus return work", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.setViewportSize({ width: 375, height: 900 });
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Sell", exact: true }).click();
  await expect(modal(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
});

test("category filters, both sort directions, recommended order and clear filters", async ({ page }) => {
  await allListings(page);
  for (const type of categories.filter(c => c.name !== "Rental Homes")) {
    await toolbar(page).getByRole("combobox", { name: "Category", exact: true }).selectOption(type.name);
    await expect(cards(page)).toHaveCount(properties.filter(p => p.type === type.name).length);
  }
  await toolbar(page).getByRole("combobox", { name: "Category", exact: true }).selectOption("");
  for (const [order, sign] of [["price-asc", 1], ["price-desc", -1]]) {
    await toolbar(page).getByRole("combobox", { name: "Sort by", exact: true }).selectOption(order);
    const expected = [...properties].sort((a, b) => sign * (a.value - b.value));
    await expect(cards(page).locator("h3")).toHaveText(expected.map(p => p.title));
  }
  await toolbar(page).getByRole("combobox", { name: "Sort by", exact: true }).selectOption("recommended");
  await expect(cards(page).locator("h3")).toHaveText(properties.map(p => p.title));
  await toolbar(page).getByRole("combobox", { name: "Listing purpose", exact: true }).selectOption("Rent");
  await toolbar(page).getByRole("combobox", { name: "Category", exact: true }).selectOption("Villas");
  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(cards(page)).toHaveCount(properties.length);
  await expect(toolbar(page).getByRole("combobox", { name: "Sort by", exact: true })).toHaveValue("recommended");
});

test("favourites toggle, counter, saved-only results and removal in details", async ({ page }) => {
  await allListings(page);
  const first = cards(page).first();
  await first.getByRole("button", { name: /^Save / }).click();
  await expect(page.getByRole("button", { name: "Favourites (1)", exact: true })).toBeVisible();
  await expect(first.getByRole("button", { name: /^Unsave / })).toHaveAttribute("aria-pressed", "true");
  await cards(page).nth(1).getByRole("button", { name: /^Save / }).click();
  await page.getByRole("button", { name: "Favourites (2)", exact: true }).click();
  await expect(cards(page)).toHaveCount(2);
  await cards(page).first().getByRole("button", { name: "View Details", exact: true }).click();
  await modal(page).getByRole("button", { name: "Remove from favourites", exact: true }).click();
  await modal(page).getByRole("button", { name: "Close dialog" }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Favourites (1)", exact: true })).toBeVisible();
  await cards(page).first().getByRole("button", { name: /^Unsave / }).click();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.locator(".empty-state")).toContainText("No saved properties");
  await expect(page.getByRole("button", { name: "Favourites (0)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Favourites (0)", exact: true }).click();
  await expect(cards(page)).toHaveCount(properties.length);
});

test("all 22 cards and detail dialogs display matching data and verification", async ({ page }) => {
  await allListings(page);
  for (const p of properties) {
    const card = cards(page).filter({ has: page.getByRole("heading", { name: p.title, exact: true }) });
    await expect(card).toContainText(p.price);
    await expect(card).toContainText(p.location);
    await expect(card).toContainText(p.bhk);
    await expect(card).toContainText(`${p.area} sq. ft.`);
    await expect(card.locator(".verified-badge")).toHaveCount(p.verified ? 1 : 0);
    await card.getByRole("button", { name: "View Details", exact: true }).click();
    await expect(modal(page)).toBeVisible();
    await expect(modal(page).getByRole("heading", { name: p.title, exact: true })).toBeVisible();
    for (const text of [p.description, p.location, p.price, p.area, p.furnishing, `AP-${String(p.id).padStart(4, "0")}`, ...p.amenities]) await expect(modal(page)).toContainText(text);
    await expect(modal(page).locator(".verified-badge")).toHaveCount(p.verified ? 1 : 0);
    await page.keyboard.press("Escape");
    await expect(modal(page)).not.toBeVisible();
  }
});

test("modal closes only on real backdrop, resets scroll, locks background and restores focus", async ({ page }) => {
  const details = cards(page).first().getByRole("button", { name: "View Details", exact: true });
  await details.click();
  const box = await modal(page).boundingBox();
  await page.mouse.click(box.x + 3, box.y + box.height / 2);
  await expect(modal(page)).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(10, 300); await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  await modal(page).evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.keyboard.press("Escape");
  await expect(details).toBeFocused();
  await details.click();
  await expect.poll(() => modal(page).evaluate(el => el.scrollTop)).toBe(0);
  await page.mouse.click(5, 200);
  await expect(modal(page)).not.toBeVisible();
  await expect(details).toBeFocused();
});

test("every header, footer, placeholder, brand and anchor control works", async ({ page }) => {
  for (const [name, purpose] of [["Buy", "Buy"], ["Rent", "Rent"], ["Land / Plots", "Plot / Land"], ["Commercial", "Commercial"]]) {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name, exact: true }).click();
    await expect(toolbar(page).getByRole("combobox", { name: "Listing purpose", exact: true })).toHaveValue(purpose);
  }
  for (const [name, text] of [["Sell", "posting is coming soon"], ["Post Property", "posting is coming soon"], ["Post Your Property", "posting is coming soon"]]) {
    await page.getByRole("button", { name, exact: name !== "Post Property" }).first().click();
    await expect(modal(page)).toContainText(text);
    await modal(page).getByRole("button", { name: "Keep exploring" }).click();
    await expect(modal(page)).not.toBeVisible();
  }
  const footer = page.locator("footer");
  for (const [name, text] of [["Post a property", "posting is coming soon"], ["Help & support", "Choose a purpose"], ["Privacy policy", "Searches and favourites"], ["Terms of use", "illustrative"]]) {
    await footer.getByRole("button", { name, exact: true }).click();
    await expect(modal(page)).toContainText(text);
    await modal(page).getByRole("button", { name: "Close dialog" }).click();
  }
  for (const [name, purpose] of [["Homes for sale", "Buy"], ["Homes for rent", "Rent"], ["Land & plots", "Plot / Land"], ["Commercial spaces", "Commercial"]]) {
    await footer.getByRole("button", { name, exact: true }).click();
    await expect(toolbar(page).getByRole("combobox", { name: "Listing purpose", exact: true })).toHaveValue(purpose);
  }
  for (const [name, hash] of [["About us", "#about"], ["Explore cities", "#cities"], ["Made with you in mind", "#search-guide"]]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
  }
  await page.getByRole("link", { name: "ApnaProperty home" }).first().click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

for (const width of [320, 375, 540, 700, 768, 960, 1050, 1200, 1440]) {
  test(`responsive layout and detail flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await verifyRenderedImages(page);
    await page.screenshot({ path: `test-results/homepage-${width}.png` });
    await expect(page.getByRole("button", { name: "Login / Sign Up", exact: true })).toBeVisible();
    await expect(page.locator(".hero-proof")).toBeVisible();
    const overflow = async () => page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll("body *")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed"; }).map(el => `${el.tagName}.${el.className}`).slice(0, 15) }));
    const initial = await overflow();
    expect(initial.document, JSON.stringify(initial)).toBeLessThanOrEqual(width);
    await allListings(page);
    const results = await overflow();
    expect(results.document, JSON.stringify(results)).toBeLessThanOrEqual(width);
    await verifyRenderedImages(page);
    await page.screenshot({ path: `test-results/listings-${width}.png`, fullPage: true });
    await cards(page).first().getByRole("button", { name: "View Details", exact: true }).click();
    await expect(modal(page)).toBeVisible();
    const box = await modal(page).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    await modal(page).getByRole("button", { name: "Save this property" }).click();
    await page.keyboard.press("Escape");
    if (width <= 1050) {
      await page.getByRole("button", { name: "Toggle navigation" }).click();
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
      await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Sell", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute("aria-expanded", "false");
    }
  });
}

test("production runtime has no console, hydration, or failed local asset errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.url().startsWith("http://localhost:3100") && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.reload({ waitUntil: "domcontentloaded" });
  await allListings(page);
  await toolbar(page).getByRole("combobox", { name: "Sort by", exact: true }).selectOption("price-asc");
  await cards(page).first().getByRole("button", { name: "View Details", exact: true }).click();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("all unique hero, city and listing image references load as real images", async ({ page, request }) => {
  await allListings(page);
  await verifyRenderedImages(page);
  const urls = await page.locator("img").evaluateAll(images => [...new Set(images.map(image => image.src))]);
  const failed = [];
  for (const url of urls) {
    const response = await request.get(url, { timeout: 20000 });
    if (!response.ok() || !response.headers()["content-type"]?.startsWith("image/")) failed.push(`${response.status()} ${url}`);
  }
  expect(failed).toEqual([]);
});
