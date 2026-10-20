import Image from "next/image";
import { photo, type Property } from "../data/properties";
import { Icon } from "./ui-icon";

export function PropertyCard({ property: p, saved, onToggle, onDetails }: { property: Property; saved: boolean; onToggle: (id: number) => void; onDetails: (property: Property) => void }) {
  return <article className="property-card">
    <div className="property-image">
      <Image src={photo(p.image)} alt={`${p.bhk} sample property in ${p.city}`} fill unoptimized sizes="(max-width: 540px) 100vw, (max-width: 1050px) 50vw, 25vw" />
      <span className="listing-badge">For {p.status === "Rent" ? "Rent" : "Sale"}</span>
      <button className={`save-button ${saved ? "saved" : ""}`} aria-label={`${saved ? "Unsave" : "Save"} ${p.title}`} aria-pressed={saved} onClick={() => onToggle(p.id)}><Icon name="heart" size={18} /></button>
      <span className="image-tag">{p.tag}</span>
    </div>
    <div className="property-info">
      <div className="property-price">{p.price}{p.status === "Rent" && <small> / month</small>}</div>
      <div className="listing-labels"><span className="sample-tag">Sample listing</span>{p.verified && <span className="verified-badge" title="Illustrative verification status for testing"><Icon name="shield" size={13} />Verified · Demo</span>}</div>
      <h3>{p.title}</h3><p className="property-location"><Icon name="pin" size={13} />{p.location}</p>
      <div className="property-specs"><span><Icon name="home" size={15} />{p.bhk}</span><span><Icon name="area" size={14} />{p.area} sq. ft.</span></div>
      <button className="details-button" onClick={() => onDetails(p)}>View Details<Icon name="arrow" size={16} /></button>
    </div>
  </article>;
}
