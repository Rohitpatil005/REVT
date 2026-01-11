import {
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "./firebase";

export interface FirestoreInvoice {
  id?: string;
  org_id: string;
  user_id: string;
  filename: string;
  total: number;
  created_at?: Date;
}

/**
 * Save invoice metadata to Firestore
 */
export async function saveInvoiceMetadata(
  orgId: string,
  userId: string,
  filename: string,
  total: number
): Promise<string> {
  const docRef = await addDoc(collection(db, "invoices"), {
    org_id: orgId,
    user_id: userId,
    filename,
    total,
    created_at: new Date(),
  });
  return docRef.id;
}

/**
 * Get all invoices for a specific user and org
 */
export async function getInvoices(
  userId: string,
  orgId: string
): Promise<FirestoreInvoice[]> {
  const q = query(
    collection(db, "invoices"),
    where("user_id", "==", userId),
    where("org_id", "==", orgId)
  );

  const querySnapshot = await getDocs(q);
  const invoices: FirestoreInvoice[] = [];

  querySnapshot.forEach((doc) => {
    invoices.push({
      id: doc.id,
      ...doc.data(),
    } as FirestoreInvoice);
  });

  return invoices;
}

/**
 * Delete invoice metadata from Firestore
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  await deleteDoc(doc(db, "invoices", invoiceId));
}
