import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

const imgDir = '/Users/avahu/projects/twitter-misinfo-project/static/twitter_profiles_img';
const files = fs.readdirSync(imgDir).filter(f => f.startsWith('Screenshot'));

async function recognize() {
  const worker = await createWorker(['chi_sim', 'eng']);
  
  for (const file of files) {
    console.log(`\n--- Reading ${file} ---`);
    const { data: { text } } = await worker.recognize(path.join(imgDir, file));
    console.log(text.trim());
  }
  await worker.terminate();
}

recognize().catch(console.error);
