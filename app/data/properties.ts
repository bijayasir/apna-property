export type Mode = "Buy" | "Rent" | "Plot / Land" | "Commercial";
export type PropertyType = "Flats / Apartments" | "Independent Houses" | "Villas" | "Residential Plots" | "Commercial Properties";
export type Property = {
  id: number; title: string; city: string; location: string; value: number;
  price: string; type: PropertyType; status: "Buy" | "Rent"; bedrooms: number | null;
  areaSqFt: number; area: string; bhk: string; image: string; tag: string;
  description: string; verified: boolean; amenities: string[]; furnishing: string;
};
export const photo = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const categories = [{ name: "Flats / Apartments", icon: "building" }, { name: "Independent Houses", icon: "home" }, { name: "Villas", icon: "key" }, { name: "Residential Plots", icon: "plot" }, { name: "Commercial Properties", icon: "building" }, { name: "Rental Homes", icon: "home" }];
export const cities = [
  { name: "Bhubaneswar", subtitle: "Tradition meets tomorrow", image: "photo-1600585154340-be6161a56a0c" },
  { name: "Cuttack", subtitle: "A city with a soul", image: "photo-1600047509807-ba8f99d2cdde" },
  { name: "Puri", subtitle: "A fresh start by the coast", image: "photo-1600607687920-4e2a09cf159d" },
  { name: "Delhi NCR", subtitle: "Big city. Bigger possibilities.", image: "photo-1512813195386-6cf811ad3542" },
  { name: "Mumbai", subtitle: "Find your place in the skyline", image: "photo-1570168007204-dfb528c6958f" },
  { name: "Bengaluru", subtitle: "Make room for a fresh start", image: "photo-1596176530529-78163a4f7af2" },
  { name: "Hyderabad", subtitle: "A home for every ambition", image: "photo-1600607687920-4e2a09cf159d" },
];
type Seed = [string, string, string, number, PropertyType, "Buy" | "Rent", number | null, number, boolean, string];
const seeds: Seed[] = [
  ["Sunlit family apartment in Patia", "Bhubaneswar", "Patia", 8500000, "Flats / Apartments", "Buy", 3, 1650, true, "A spacious corner apartment with two balconies, a separate dining area and convenient access to schools and the Patia technology corridor."],
  ["Garden villa in Whitefield", "Bengaluru", "Whitefield", 14500000, "Villas", "Buy", 4, 2850, true, "A two-storey villa with a private garden, covered parking and a flexible study in a quiet residential enclave."],
  ["Furnished apartment in Powai", "Mumbai", "Powai", 42000, "Flats / Apartments", "Rent", 2, 1120, false, "A furnished apartment with an open living area, fitted kitchen and easy access to local shops and business parks."],
  ["Contemporary apartment in Gachibowli", "Hyderabad", "Gachibowli", 11000000, "Flats / Apartments", "Buy", 3, 1850, true, "An airy apartment with generous bedrooms and a covered balcony in a community close to the financial district."],
  ["Independent family home in CDA", "Cuttack", "CDA Sector 9", 5800000, "Independent Houses", "Buy", 3, 1800, true, "A practical family house with a front courtyard, separate utility area and established neighbourhood amenities."],
  ["Residential plot in Sundarpada", "Bhubaneswar", "Sundarpada", 3200000, "Residential Plots", "Buy", null, 2400, true, "A level residential plot with road access, offering room for a detached home and a garden. Document details are illustrative in this demo."],
  ["Office suite in Noida Sector 62", "Delhi NCR", "Sector 62, Noida", 9500000, "Commercial Properties", "Buy", null, 1450, true, "A flexible office suite with space for workstations, a meeting room and reception, near established commercial developments."],
  ["Independent home in Gurugram", "Delhi NCR", "Sector 43, Gurugram", 28000, "Independent Houses", "Rent", 2, 1200, false, "A comfortable independent home with a private entrance and a spacious kitchen in a well-connected residential neighbourhood."],
  ["Corner residential plot in Trisulia", "Cuttack", "Trisulia", 2600000, "Residential Plots", "Buy", null, 2000, false, "A corner plot with an open outlook and scope for a custom family home, within reach of the Cuttack–Bhubaneswar corridor."],
  ["Coastal apartment on VIP Road", "Puri", "VIP Road", 4600000, "Flats / Apartments", "Buy", 2, 1050, true, "A bright apartment with a balcony and an efficient layout, suited to everyday living or a coastal retreat."],
  ["Rental apartment in Baliapanda", "Puri", "Baliapanda", 16000, "Flats / Apartments", "Rent", 2, 950, false, "A compact furnished apartment with a breezy living room, close to local conveniences and the coast."],
  ["Courtyard villa in Puri", "Puri", "Marine Drive Road", 12500000, "Villas", "Buy", 3, 2400, true, "A private villa with a shaded courtyard, three generous bedrooms and a terrace for relaxed evenings."],
  ["Residential land near Chandanpur", "Puri", "Chandanpur", 1800000, "Residential Plots", "Buy", null, 1800, false, "A residential site in a developing locality with space to plan a modest home. Buyers should independently check permissions for live properties."],
  ["Rental apartment in Khandagiri", "Bhubaneswar", "Khandagiri", 22000, "Flats / Apartments", "Rent", 3, 1350, true, "A family-sized rental with a separate utility balcony and parking, conveniently located for daily commuting."],
  ["Retail space in Saheed Nagar", "Bhubaneswar", "Saheed Nagar", 35000, "Commercial Properties", "Rent", null, 650, true, "A street-facing commercial unit suitable for a small showroom or office, with a flexible open floor plan."],
  ["Rental family house in Cuttack", "Cuttack", "Bidanasi", 18000, "Independent Houses", "Rent", 2, 1100, true, "A well-proportioned independent rental with a private entrance and space for a small family."],
  ["Modern apartment in Sarjapur", "Bengaluru", "Sarjapur Road", 7800000, "Flats / Apartments", "Buy", 2, 1250, false, "A modern apartment with a practical kitchen and balcony in a community offering shared recreation spaces."],
  ["Furnished rental in HSR Layout", "Bengaluru", "HSR Layout", 38000, "Flats / Apartments", "Rent", 2, 1180, true, "A furnished rental with a dedicated work corner and easy access to neighbourhood cafes and daily essentials."],
  ["Rental villa in Kondapur", "Hyderabad", "Kondapur", 55000, "Villas", "Rent", 4, 2600, true, "A spacious villa with a family lounge, a private terrace and covered parking, suited to longer-term family living."],
  ["Business-ready office in Madhapur", "Hyderabad", "Madhapur", 48000, "Commercial Properties", "Rent", null, 1200, false, "An office with a flexible layout and room for a small team, reception and a meeting area near the technology corridor."],
  ["Apartment in Greater Noida West", "Delhi NCR", "Greater Noida West", 7200000, "Flats / Apartments", "Buy", 3, 1480, true, "A three-bedroom apartment with an open living and dining area, balcony and shared community amenities."],
  ["Residential plot in Devanahalli", "Bengaluru", "Devanahalli", 6400000, "Residential Plots", "Buy", null, 2400, true, "A residential plot with road frontage and room for a spacious custom home in a growing northern suburb."],
];
const images: Record<PropertyType, string> = { "Flats / Apartments": "photo-1600210492486-724fe5c67fb0", "Independent Houses": "photo-1600047509807-ba8f99d2cdde", "Villas": "photo-1613977257363-707ba9348227", "Residential Plots": "photo-1500382017468-9049fed747ef", "Commercial Properties": "photo-1497366754035-f200968a6e72" };
export function formatPrice(value: number, status: "Buy" | "Rent") {
  if (status === "Rent") return `₹ ${value.toLocaleString("en-IN")}`;
  return value >= 10000000 ? `₹ ${Number((value / 10000000).toFixed(2))} Cr` : `₹ ${Number((value / 100000).toFixed(2))} Lac`;
}
export const properties: Property[] = seeds.map(([title, city, neighbourhood, value, type, status, bedrooms, areaSqFt, verified, description], index) => ({
  id: index + 1, title, city, location: `${neighbourhood}, ${city}`, value, price: formatPrice(value, status), type, status, bedrooms, areaSqFt,
  area: areaSqFt.toLocaleString("en-IN"), bhk: bedrooms ? `${bedrooms} BHK ${type === "Villas" ? "Villa" : type === "Independent Houses" ? "House" : "Apartment"}` : type === "Residential Plots" ? "Residential Plot" : "Commercial Space",
  image: index === 0 ? "photo-1600585154340-be6161a56a0c" : index === 3 ? "photo-1600607687920-4e2a09cf159d" : images[type],
  tag: type === "Residential Plots" ? "Residential land" : status === "Rent" ? "Available to rent" : "Ready to move", description, verified,
  furnishing: type === "Residential Plots" ? "Not applicable" : status === "Rent" && type === "Flats / Apartments" ? "Furnished" : "Unfurnished",
  amenities: type === "Residential Plots" ? ["Road access", "Residential locality"] : type === "Commercial Properties" ? ["Visitor parking", "Power backup", "Flexible layout"] : ["Car parking", "Water supply", "Balcony / outdoor space"],
}));
