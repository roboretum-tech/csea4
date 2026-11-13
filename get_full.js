import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const docSnap = await getDoc(doc(db, "applicants", "pxwbxg9ga"));
  const data = docSnap.data();
  
  // Calculate dimensional scores
  const blocks = data.interview.bloques;
  let globalTotal = 0;
  let globalMax = 0;
  
  const dimScores = blocks.map(b => {
     let bTotal = 0;
     let bMax = b.preguntas.length * 5;
     b.preguntas.forEach(q => bTotal += q.score || 0);
     const score5 = ((bTotal / bMax) * 5).toFixed(1);
     
     globalTotal += bTotal;
     globalMax += bMax;
     
     return {
       name: b.nombreBloque,
       score: parseFloat(score5)
     };
  });
  
  const globalIndex = Math.round((globalTotal / globalMax) * 100);
  
  const out = {
     company: data.companyName,
     sponsor: data.sponsorName,
     date: data.timestamp,
     globalIndex,
     dimScores,
     // Just get the notes/responses for each block to help with the qualitative analysis
     qualitative: blocks.map(b => ({
       name: b.nombreBloque,
       responses: b.preguntas.map(q => ({ q: q.texto, a: q.respuesta, s: q.score }))
     }))
  };
  
  fs.writeFileSync('acme_data.json', JSON.stringify(out, null, 2));
  process.exit(0);
}
run().catch(console.error);
