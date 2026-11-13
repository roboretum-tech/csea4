import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const docSnap = await getDoc(doc(db, "applicants", "pxwbxg9ga"));
  const data = docSnap.data();
  console.log(JSON.stringify(data.interview, null, 2));
  process.exit(0);
}
run().catch(console.error);
