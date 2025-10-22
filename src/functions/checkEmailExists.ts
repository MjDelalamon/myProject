// src/functions/checkEmailExists.ts
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebaseConfig";

export const checkEmailExists = async (email: string) => {
  const q = query(collection(db, "customers"), where("email", "==", email));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
