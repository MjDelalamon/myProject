import { db, storage } from "../Firebase/firebaseConfig"; 
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";

export const addCustomerToFirestore = async (
  name: string,
  email: string,
  mobile: string,
  wallet: number
) => {
  try {
    // Step 1: bilangin lahat ng documents para makuha next number
    const snapshot = await getDocs(collection(db, "customers"));
    const count = snapshot.size + 1;

    // Step 2: gumawa ng "0001, 0002..."
    const customerNumber = count.toString().padStart(4, "0");

    // Step 3: add new doc (wala pa QR code)
    const customerRef = await addDoc(collection(db, "customers"), {
      customerNumber,  // 🔹 ito yung ID sa Firestore at table
      name,
      email,
      mobile,
      wallet,
      tier: "Bronze",
      status: "Active",
      points: 0,
      qrCode: "",
      dateJoined: new Date().toISOString(),
    });

    // Step 4: generate QR from Firestore doc.id
    const qrDataUrl: string = await QRCode.toDataURL(customerRef.id);

    const response = await fetch(qrDataUrl);
    const qrBlob = await response.blob();

    const storageRef = ref(storage, `qrcodes/${customerRef.id}.png`);
    await uploadBytes(storageRef, qrBlob);

    const qrUrl = await getDownloadURL(storageRef);

    // Step 5: update Firestore with QR code URL
    await updateDoc(doc(db, "customers", customerRef.id), {
      qrCode: qrUrl,
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
