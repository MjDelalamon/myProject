import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocs, collection, addDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";

const firebaseConfig = {
  apiKey: "AIzaSyDxosd6yCZCVd2NGLlIiAthRoCfxAEUrdA",
  authDomain: "systemproject-de072.firebaseapp.com",
  projectId: "systemproject-de072",
  storageBucket: "systemproject-de072.appspot.com",
  messagingSenderId: "427445110062",
  appId: "1:427445110062:web:3a870fac07be2b369326bf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // 🔹 Add this

export const addCustomerToFirestore = async (
  name: string,
  email: string,
  mobile: string,
  wallet: number
) => {
  try {
    const snapshot = await getDocs(collection(db, "customers"));
    const count = snapshot.size + 1;

    const customerNumber = count.toString().padStart(4, "0");

    const customerRef = await addDoc(collection(db, "customers"), {
      customerNumber,
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

    const qrDataUrl: string = await QRCode.toDataURL(customerRef.id);

    const response = await fetch(qrDataUrl);
    const qrBlob = await response.blob();

    const storageRef = ref(storage, `qrcodes/${customerRef.id}.png`);
    await uploadBytes(storageRef, qrBlob);

    const qrUrl = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "customers", customerRef.id), {
      qrCode: qrUrl,
    });

    return { success: true, id: customerRef.id, customerNumber };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
