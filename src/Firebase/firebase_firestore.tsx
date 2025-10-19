import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxosd6yCZCVd2NGLlIiAthRoCfxAEUrdA",
  authDomain: "systemproject-de072.firebaseapp.com",
  projectId: "systemproject-de072",
  storageBucket: "systemproject-de072.appspot.com", // dapat .appspot.com
  messagingSenderId: "427445110062",
  appId: "1:427445110062:web:3a870fac07be2b369326bf",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const AdminUserPin = async () => {
  const docRefAdmin = doc(db, "AdminUser", "Admin");
  const docSnap = await getDoc(docRefAdmin);

  if (docSnap.exists()) {
    const adminPin = docSnap.data().PIN;
    return adminPin;
  } else {
    console.log("No such document!");
    return null;
  }
};
const StaffUserPin = async () => {
  const docRefStaff = doc(db, "AdminUser", "Staff");
  const docSnap = await getDoc(docRefStaff);

  if (docSnap.exists()) {
    const staffPin = docSnap.data().PIN;
    return staffPin;
  } else {
    console.log("No such document!");
    return null;
  }
};

export { StaffUserPin };
export { AdminUserPin };
