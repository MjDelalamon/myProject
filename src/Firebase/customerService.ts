// src/services/addCustomerToFirestore.ts
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";  
import QRCode from "qrcode";

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

    // gamit ang doc ID bilang QR value
    const qrValue = customerRef.id;

    // generate QR code as Data URL (base64 image)
    const qrCodeImage = await QRCode.toDataURL(qrValue);

    // update yung qrCode field with doc id
    await updateDoc(doc(db, "customers", customerRef.id), {
      qrCode: qrValue,
    });

    return { 
      success: true, 
      id: customerRef.id, 
      customerNumber,
      qrCodeImage // ito yung pwede mong i-render <img src={qrCodeImage} />
    };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
