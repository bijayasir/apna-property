import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { firebaseDb } from "./admin";
import { sessionIdentity } from "../auth/server";

// Foundation for future API routes. Routes must still enforce same-origin mutations,
// input validation and rate limits. No sample listings are migrated automatically.
const documentId = (value: string) => {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error("Invalid document ID.");
  return value;
};
async function viewerId() {
  const user = await sessionIdentity();
  if (!user) throw new Error("Verified sign-in is required.");
  return documentId(user.uid);
}
export async function publishedListings(limit = 24) {
  const count = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 24;
  const snapshot = await firebaseDb().collection("properties").where("status", "==", "published").orderBy("createdAt", "desc").limit(count).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function accountFavourites() {
  const uid = await viewerId();
  const snapshot = await firebaseDb().collection(`users/${uid}/favourites`).orderBy("createdAt", "desc").limit(100).get();
  return snapshot.docs.map(doc => doc.id);
}
export async function setAccountFavourite(propertyId: string, saved: boolean) {
  const uid = await viewerId(); const id = documentId(propertyId);
  const reference = firebaseDb().doc(`users/${uid}/favourites/${id}`);
  if (!saved) { await reference.delete(); return; }
  await firebaseDb().runTransaction(async transaction => {
    const property = await transaction.get(firebaseDb().doc(`properties/${id}`));
    if (!property.exists || property.data()?.status !== "published") throw new Error("This property is not available.");
    transaction.set(reference, { propertyId: id, createdAt: FieldValue.serverTimestamp() });
  });
}
