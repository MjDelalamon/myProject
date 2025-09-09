import { db, storage } from "./firebaseConfig";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";

export const addCustomerToFirestore = async (
  name: string,
  email: string,
  mobile: string,
  wallet: number
) => {
  try {
    // Step 1: Create customer document (placeholder qrCode)
    const customerRef = await addDoc(collection(db, "customers"), {
      name,
      email,
      mobile,
      wallet,
      tier: "Bronze",
      status: "Active",
      points: 0,
      dateJoined: new Date().toISOString().split("T")[0],
      qrCode: "",
    });

    const customerId = customerRef.id;

    // Step 2: Generate QR code (DataURL from qrcode lib)
    const qrDataUrl = await QRCode.toDataURL(customerId);

    // Step 3: Convert DataURL → Blob
    const qrBlob = await (await fetch(qrDataUrl)).blob();

    // Step 4: Upload QR PNG to Firebase Storage
    const storageRef = ref(storage, `qrcodes/${customerId}.png`);
    await uploadBytes(storageRef, qrBlob);

    // Step 5: Get download URL
    const qrUrl = await getDownloadURL(storageRef);

    // Step 6: Update customer doc with qrCode URL
    await updateDoc(doc(db, "customers", customerId), { qrCode: qrUrl });

    return { success: true, customerId, qrUrl };
  } catch (err) {
    console.error("Error adding customer:", err);
    return { success: false, error: err };
  }
};
