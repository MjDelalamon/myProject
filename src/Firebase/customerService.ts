// src/services/addCustomerToFirestore.ts
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";  // gamitin yung db na in-export mo

export const addCustomerToFirestore = async (
  name: string,
  email: string,
  mobile: string,
  wallet: number
) => {
  try {
    // bilangin existing customers
    const snapshot = await getDocs(collection(db, "customers"));
    const count = snapshot.size + 1;

    // auto-generate customer number, ex: 0001, 0002...
    const customerNumber = count.toString().padStart(4, "0");

    // create customer document
    const customerRef = await addDoc(collection(db, "customers"), {
      customerNumber,
      name,
      email,
      mobile,
      wallet,
      tier: "Bronze",
      status: "Active",
      points: 0,
      qrCode: "", // i-uupdate agad after
      dateJoined: new Date().toISOString(),
    });

    // update yung qrCode field with doc id
    await updateDoc(doc(db, "customers", customerRef.id), {
      qrCode: customerRef.id,
    });

    return { success: true, id: customerRef.id, customerNumber };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
