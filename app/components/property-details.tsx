import Image from "next/image";
import { photo, type Property } from "../data/properties";
import { Icon } from "./ui-icon";

export function PropertyDetails({ property: p, saved, onToggle }: { property: Property; saved: boolean; onToggle: (id: number) => void }) {
  return <>
    <div className="modal-image"><Image src={photo(p.image)} alt={p.title} fill unoptimized sizes="600px" /></div>
    <span className="eyebrow small">SAMPLE PROPERTY · FOR {p.status === "Rent" ? "RENT" : "SALE"}</span>
    <h2 id="dialog-title">{p.title}</h2><p><Icon name="pin" size={16} /> {p.location}</p>
    <h3>{p.price}{p.status === "Rent" ? " / month" : ""}</h3>
    <div className="modal-specs"><span>{p.bhk}</span><span>{p.area} sq. ft.</span><span>{p.tag}</span></div>
    {p.verified && <span className="verified-badge"><Icon name="shield" size={15} />Verified · Demo</span>}
    <h3 className="detail-heading">About this property</h3><p>{p.description}</p>
    <dl className="detail-facts">
      <div><dt>Property type</dt><dd>{p.type}</dd></div><div><dt>Listing purpose</dt><dd>{p.status === "Rent" ? "For rent" : "For sale"}</dd></div>
      <div><dt>Bedrooms</dt><dd>{p.bedrooms ?? "Not applicable"}</dd></div><div><dt>Area</dt><dd>{p.area} sq. ft.</dd></div>
      <div><dt>Furnishing</dt><dd>{p.furnishing}</dd></div><div><dt>Listing reference</dt><dd>AP-{String(p.id).padStart(4, "0")}</dd></div>
    </dl>
    <h3 className="detail-heading">Property highlights</h3><ul className="detail-amenities">{p.amenities.map(a => <li key={a}><Icon name="check" size={15} />{a}</li>)}</ul>
    <p className="detail-disclaimer">This is a sample listing. Prices, images, availability and verification badges are illustrative; no live verification or owner contact is provided.</p>
    <button className="primary" aria-pressed={saved} onClick={() => onToggle(p.id)}>{saved ? "Remove from favourites" : "Save this property"}<Icon name="heart" size={17} /></button>
  </>;
}
