import type { AccountType } from "../auth/validation";

// Firestore document timestamps are server timestamps, never browser-supplied.
export interface UserProfile {
  fullName: string;
  mobile: string;
  mobileVerified: false;
  accountType: AccountType; // preference, NEVER an authorization role
}
export interface ListingDocument {
  ownerId: string;
  title: string;
  city: string;
  locality: string;
  price: number; // integer INR; monthly amount for rent
  purpose: "Buy" | "Rent";
  category: "Apartment" | "Independent House" | "Villa" | "Residential Plot" | "Commercial";
  bedrooms: number | null;
  areaSqFt: number;
  description: string;
  imagePaths: string[];
  status: "draft" | "pending" | "published" | "archived";
  verified: boolean; // server/moderator controlled
}
export interface OwnerAgentDocument {
  userId: string;
  kind: "owner" | "agent";
  displayName: string;
  agencyName?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  // Private contact/documents stay here, never in public listing documents.
}
export interface FavouriteDocument { propertyId: string }
export interface EnquiryDocument {
  propertyId: string;
  senderId: string;
  recipientId: string;
  message: string;
  status: "new" | "read" | "closed";
}
