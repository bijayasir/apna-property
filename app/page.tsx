"use client";

import Image from "next/image";
import { AuthPanel } from "./components/auth/auth-panel";
import { useAuth } from "./components/auth/use-auth";
import { useEffect, useRef, useState } from "react";

import { properties, cities, categories, photo, type Mode, type Property } from "./data/properties";
import { Icon } from "./components/ui-icon";
import { PropertyCard } from "./components/property-card";
import { PropertyDetails } from "./components/property-details";
import { ResultsToolbar } from "./components/results-toolbar";
import { emptyFilters, filterProperties, sortProperties, type Filters, type SortOrder } from "./lib/property-search";

function Brand() { return <a href="#" className="brand" aria-label="ApnaProperty home"><span className="brand-icon"><Icon name="home" size={25} /></span><span>Apna<span className="brand-light">Property</span><span className="brand-dot">.</span></span></a>; }
export default function Home() {
  const auth = useAuth();
  const [authNotice, setAuthNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("auth");
    if (status === "confirmed" || status === "link-error") {
      setAuthNotice(status === "confirmed" ? "Your account link has been processed. Check your account or log in to continue." : "This account link is invalid or expired. Please request a new link.");
      url.searchParams.delete("auth"); window.history.replaceState(null, "", url);
    }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error();
      auth.setUser(null); setAuthNotice("You have been signed out.");
    } catch { setAuthNotice("Unable to sign out. Please try again."); }
    finally { setLoggingOut(false); }
  }
  const [mode, setMode] = useState<Filters["mode"]>("Buy");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [applied, setApplied] = useState<Filters | null>(null);
  const [sort, setSort] = useState<SortOrder>("recommended");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);
  const [dialogKind, setDialogKind] = useState("details");
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [dialogOpen]);
  function showResults(filters: Filters, scroll = true) {
    setApplied(filters); setFavouritesOnly(false); setSort("recommended");
    if (scroll) scrollToElement(document.getElementById("properties"), "start");
  }
  function scrollToElement(element: HTMLElement | null, block: ScrollLogicalPosition) {
    element?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block });
  }
  function search() { showResults({ mode, city, type, budget }); }
  function changeMode(nextMode: Mode) {
    setMode(nextMode); setType(""); setBudget("");
    showResults({ mode: nextMode, city, type: "", budget: "" }, false);
  }
  function navigate(nextMode: Mode) { changeMode(nextMode); setMobileMenu(false); scrollToElement(searchRef.current, "center"); }
  function open(kind: string, property: Property | null = null) {
    dialogTrigger.current = mobileMenu ? mobileToggle.current : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMobileMenu(false); setDialogKind(kind); setSelected(property);
    dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
    setDialogOpen(true);
  }
  function closeCompleted() { setDialogOpen(false); dialogTrigger.current?.focus({ preventScroll: true }); }
  function backToFeatured() { setApplied(null); setMode("Buy"); setCity(""); setType(""); setBudget(""); setSort("recommended"); setFavouritesOnly(false); }
  function toggleSaved(id: number) { setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function updateFilters(filters: Filters) {
    setApplied(filters); setMode(filters.mode); setCity(filters.city); setType(filters.type); setBudget(filters.budget);
  }
  function resetFilters() { setMode(""); setCity(""); setType(""); setBudget(""); setApplied({ ...emptyFilters }); setSort("recommended"); setFavouritesOnly(false); }
  function citySearch(name: string) { setCity(name); setType(""); setBudget(""); setMode(""); showResults({ ...emptyFilters, city: name }); }
  function categorySearch(name: string) {
    const nextMode: Mode = name === "Rental Homes" ? "Rent" : name === "Residential Plots" ? "Plot / Land" : name === "Commercial Properties" ? "Commercial" : "Buy";
    const category = name === "Rental Homes" ? "" : name;
    setCity(""); setBudget(""); setMode(nextMode); setType(category);
    showResults({ mode: nextMode, city: "", type: category, budget: "" });
  }
  function popularSearch(index: number) {
    const name = ["Bhubaneswar", "Cuttack", "Bengaluru"][index];
    const category = index === 0 ? "Flats / Apartments" : index === 1 ? "Residential Plots" : "";
    const nextMode = index === 1 ? "Plot / Land" : "Buy";
    setCity(name); setType(category); setMode(nextMode); setBudget("");
    showResults({ mode: nextMode, city: name, type: category, budget: "" });
  }
  const results = applied !== null;
  const filtered = applied ? filterProperties(properties, applied) : properties.slice(0, 4);
  const shown = sortProperties(favouritesOnly ? filtered.filter(p => saved.includes(p.id)) : filtered, sort);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header" onKeyDown={e => { if (e.key === "Escape" && mobileMenu) { setMobileMenu(false); mobileToggle.current?.focus(); } }}><div className="header-inner"><Brand /><nav className={mobileMenu ? "navigation open" : "navigation"} id="main-navigation" aria-label="Main navigation">{(["Buy", "Rent", "Sell", "Land / Plots", "Commercial"] as const).map(n => <button key={n} onClick={() => n === "Sell" ? open("post") : navigate(n === "Land / Plots" ? "Plot / Land" : n)}>{n}</button>)}</nav><div className="header-actions"><button className="post-button" onClick={() => open("post")}>Post Property <span>FREE</span></button>{auth.user ? <div className="account-controls"><button className="login-button" aria-label="Account / Profile" title={auth.user.name} onClick={() => open("login")}><Icon name="user" size={17} /><span className="account-name">{auth.user.name}</span></button><button className="auth-logout" disabled={loggingOut} onClick={logout}>{loggingOut ? "Signing out…" : "Logout"}</button></div> : <button className="login-button" aria-label="Login / Sign Up" onClick={() => open("login")}><Icon name="user" size={17} /><span>Login / Sign Up</span></button>}<button className="mobile-toggle" ref={mobileToggle} aria-controls="main-navigation" aria-label="Toggle navigation" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Icon name={mobileMenu ? "close" : "menu"} /></button></div></div></header>
    <main id="main" tabIndex={-1}>
      {authNotice && <div className="auth-notice" role="status">{authNotice}<button aria-label="Dismiss account notice" onClick={() => setAuthNotice("")}> ×</button></div>}
      <section className="hero"><Image className="hero-image" src={photo("photo-1600607687939-ce8a6c25118c", 2000)} alt="Contemporary home opening onto a sunlit garden" fill unoptimized preload sizes="100vw" /><div className="hero-shade" /><div className="hero-content container"><div className="eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Find a place you’ll<br />love to call <em>your own.</em></h1><p>From your first home to your next big move.<br />Discover spaces that feel just right, across India.</p><div className="hero-proof"><Icon name="shield" size={17} />Real spaces. Real possibilities. Your kind of home.</div></div><div className="hero-caption"><span /> A space for every story.</div></section>
      <div className="container search-container" ref={searchRef}><div className="search-box"><div className="search-tabs" role="group" aria-label="Property search purpose">{(["Buy", "Rent", "Plot / Land", "Commercial"] as Mode[]).map(tab => <button key={tab} className={mode === tab ? "active" : ""} aria-pressed={mode === tab} onClick={() => changeMode(tab)}>{tab}</button>)}<span className="search-note"><Icon name="shield" size={14} /> Your perfect place, a search away</span></div><form className="search-fields" onSubmit={e => { e.preventDefault(); search(); }}><label className="location-field"><span><Icon name="pin" size={17} /> CITY / LOCATION</span><input list="city-options" value={city} onChange={e => setCity(e.target.value)} placeholder="Where do you want to live?" /><datalist id="city-options">{cities.map(c => <option key={c.name} value={c.name} />)}</datalist></label><label><span>PROPERTY TYPE</span><select value={type} onChange={e => setType(e.target.value)}><option value="">All property types</option>{categories.filter(c => c.name !== "Rental Homes" && (mode !== "Plot / Land" || c.name === "Residential Plots") && (mode !== "Commercial" || c.name === "Commercial Properties")).map(c => <option key={c.name}>{c.name}</option>)}</select></label><label><span>BUDGET</span><select value={budget} onChange={e => setBudget(e.target.value)}><option value="">Select your budget</option>{(mode === "Rent" ? [["20000", "Up to ₹20,000 / month"], ["40000", "Up to ₹40,000 / month"], ["60000", "Up to ₹60,000 / month"]] : [["5000000", "Up to ₹50 Lac"], ["10000000", "Up to ₹1 Cr"], ["20000000", "Up to ₹2 Cr"]]).map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></label><button className="primary search-submit" type="submit"><Icon name="search" size={19} /> Search Properties</button></form></div><div className="popular"><span>Popular searches:</span>{["Flats in Bhubaneswar", "Plots in Cuttack", "Homes in Bengaluru"].map((s, i) => <button key={s} onClick={() => popularSearch(i)}>{s}<span>↗</span></button>)}</div></div>
      <section className="container categories-section"><div className="section-heading compact"><h2>What feels like home?</h2><p>A place for every lifestyle, a space for every dream.</p></div><div className="category-grid">{categories.map(c => <button className="category" key={c.name} onClick={() => categorySearch(c.name)}><span className="category-icon"><Icon name={c.icon} size={27} /></span><span>{c.name}</span><Icon name="arrow" size={15} /></button>)}</div></section>
      <section className="featured-section" id="properties"><div className="container"><div className="section-heading"><div><span className="eyebrow small">FEATURED PROPERTIES · HANDPICKED FOR YOU</span><h2>{results ? "Find your perfect match" : "Featured properties. Exceptional possibilities."}</h2><p aria-live="polite">{results ? `${shown.length} sample ${shown.length === 1 ? "property" : "properties"} matching your search` : "Explore a few favourites. Your next home could be right here."}</p></div><button className="text-link" onClick={() => { if (results) { backToFeatured(); } else { resetFilters(); } }}>{results ? "Back to featured" : "Explore all properties"}<Icon name="arrow" size={18} /></button></div>{results && <ResultsToolbar filters={applied!} sort={sort} favouritesOnly={favouritesOnly} savedCount={saved.length} onFilters={updateFilters} onSort={setSort} onFavourites={() => setFavouritesOnly(current => !current)} onReset={resetFilters} />}<div className="property-grid">{shown.map(p => <PropertyCard key={p.id} property={p} saved={saved.includes(p.id)} onToggle={toggleSaved} onDetails={p => open("details", p)} />)}</div>{!shown.length && <div className="empty-state"><Icon name="search" size={32} /><h3>{favouritesOnly ? "No saved properties match your filters." : "A fresh search might be the one."}</h3><p>{favouritesOnly ? "Save a property with the heart button, or clear your filters to browse all listings." : "No sample listings match these filters. Try another city, category or a wider budget."}</p><button className="primary" onClick={resetFilters}>Reset search</button></div>}<p className="listing-disclaimer">A preview of what’s possible. All listings and prices shown are illustrative.</p></div></section>
      <section className="container city-section" id="cities"><div className="section-heading"><div><span className="eyebrow small">PROPERTIES BY CITY</span><h2>Where do you see yourself?</h2><p>Explore properties in the cities you love.</p></div><span className="city-note">Find your neighbourhood <Icon name="pin" size={17} /></span></div><div className="city-grid">{cities.map(c => <button className="city-card" key={c.name} onClick={() => citySearch(c.name)}><Image src={photo(c.image, 600)} alt="" fill unoptimized sizes="(max-width: 700px) 50vw, 20vw" /><span className="city-overlay" /><span className="city-text"><strong>{c.name}</strong><span>{c.subtitle}</span></span><span className="city-arrow"><Icon name="arrow" size={17} /></span></button>)}</div></section>
      <section className="why-section" id="about"><div className="container why-inner"><div className="why-intro"><span className="eyebrow small">WHY APNAPROPERTY?</span><h2>A big decision.<br />A little more confidence.</h2><p>Because finding your place should feel simple, personal, and reassuring.</p><a className="text-link" href="#search-guide">Made with you in mind <Icon name="arrow" size={18} /></a></div><div className="benefit-grid" id="search-guide">{[{ icon: "shield", title: "Verified Properties", text: "A focus on clear property information, so you can explore with confidence." }, { icon: "user", title: "Direct Owner Contact", text: "Built for direct conversations. Fewer middle steps, more clarity." }, { icon: "search", title: "Easy Property Search", text: "The right filters to help you find a space that fits your life." }, { icon: "check", title: "Trusted Listings", text: "Thoughtful listings with the details that matter to your next move." }].map(b => <div className="benefit" key={b.title}><span><Icon name={b.icon} size={25} /></span><h3>{b.title}</h3><p>{b.text}</p></div>)}</div></div></section>
      <section className="container"><div className="post-cta" id="post-property"><div className="cta-art"><Icon name="home" size={115} /><span>✦</span></div><div className="cta-copy"><span className="eyebrow small">YOUR PROPERTY. SOMEONE’S NEW BEGINNING.</span><h2>Great properties deserve to be seen.</h2><p>Have a home to sell or a space to rent? Let’s find its next story.</p></div><div className="cta-action"><button className="primary" onClick={() => open("post")}>Post Your Property <Icon name="arrow" size={18} /></button><span>It’s simple. And it’s free.</span></div></div></section>
    </main>
    <footer><div className="container footer-main"><div className="footer-brand"><Brand /><p>Connecting people, places, and possibilities.<br />Find your own corner of India.</p><span className="made-in">Thoughtfully made for India <span>↗</span></span></div><div><h3>Find a property</h3>{(["Buy", "Rent", "Plot / Land", "Commercial"] as Mode[]).map(m => <button key={m} onClick={() => navigate(m)}>{m === "Buy" ? "Homes for sale" : m === "Rent" ? "Homes for rent" : m === "Plot / Land" ? "Land & plots" : "Commercial spaces"}</button>)}</div><div><h3>Explore ApnaProperty</h3><a href="#about">About us</a><a href="#cities">Explore cities</a><button onClick={() => open("post")}>Post a property</button><button onClick={() => open("help")}>Help & support</button></div><div className="footer-message"><h3>A home is more than an address.</h3><p>It’s where your next chapter begins.<br />We’re here to help you find it.</p><span>Let’s get you home. <Icon name="arrow" size={19} /></span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} ApnaProperty. All rights reserved.</span><div><button onClick={() => open("privacy")}>Privacy policy</button><button onClick={() => open("terms")}>Terms of use</button></div></div></footer>
    <dialog ref={dialog} className="modal" aria-labelledby="dialog-title" onClose={closeCompleted} onClick={e => { if (e.target !== e.currentTarget) return; const bounds = e.currentTarget.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) dialog.current?.close(); }}><button className="modal-close" aria-label="Close dialog" onClick={() => dialog.current?.close()}><Icon name="close" /></button>{dialogKind === "login" ? dialogOpen ? <AuthPanel user={auth.user} configured={auth.configured} serviceError={auth.serviceError} onRetry={auth.refresh} onUser={auth.setUser} /> : null : dialogKind === "details" && selected ? <PropertyDetails property={selected} saved={saved.includes(selected.id)} onToggle={toggleSaved} /> : <><span className="dialog-icon"><Icon name={dialogKind === "post" ? "home" : "shield"} size={30} /></span><h2 id="dialog-title">{dialogKind === "post" ? "Your property’s next chapter" : dialogKind === "login" ? "Welcome to ApnaProperty" : dialogKind === "help" ? "How can we help?" : dialogKind === "privacy" ? "Your privacy matters" : "About this preview"}</h2><p>{dialogKind === "post" ? "Free property posting is coming soon. This first version lets you explore the marketplace design and sample properties. No listing is submitted from this preview." : dialogKind === "login" ? "Accounts and sign-up are coming in a future release. For now, explore sample properties and save favourites during your visit, with no account needed." : dialogKind === "help" ? "Choose a purpose, enter a city, then select a property type and budget. Explore the sample results and open a listing to see more details. Live owner contact and support are coming soon." : dialogKind === "privacy" ? "Searches and favourites stay within this page session. When account services are configured, registration and login details are sent to our server and Firebase Authentication to manage your account. Passwords are not saved in browser storage. Property photographs load from Unsplash, which receives image requests from your browser." : "ApnaProperty is a frontend marketplace preview. Listings, prices, photographs, and availability are illustrative and are not offers to sell or rent. Live listings and service terms will be added before launch."}</p><button className="primary" onClick={() => dialog.current?.close()}>Keep exploring<Icon name="arrow" size={17} /></button></>}</dialog>
  </>;
}
