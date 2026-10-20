import "server-only";
import { randomUUID } from "node:crypto";
import { sessionIdentity } from "../auth/server";
import { firebaseDb, firebaseBucket } from "./admin";

const imageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
// No upload endpoint is exposed yet. A future endpoint must enforce CSRF, quotas,
// verify/decode/re-encode image bytes, and moderate before public publication.
export async function propertyUploadTarget(propertyId: string, contentType: string, size: number) {
  const user = await sessionIdentity();
  if (!user || !/^[A-Za-z0-9_-]{1,128}$/.test(propertyId) || !imageTypes[contentType] || !Number.isSafeInteger(size) || size <= 0 || size > 5 * 1024 * 1024) throw new Error("Invalid or unauthorized image upload.");
  const property = await firebaseDb().doc(`properties/${propertyId}`).get();
  if (!property.exists || property.data()?.ownerId !== user.uid || !["draft", "pending"].includes(property.data()?.status)) throw new Error("Property ownership is required.");
  const path = `property-uploads/${user.uid}/${propertyId}/${randomUUID()}.${imageTypes[contentType]}`;
  return { path, file: firebaseBucket().file(path) };
}
