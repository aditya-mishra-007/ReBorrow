import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from '../models/Asset';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const assets = await Asset.find({}).lean();
    console.log(`FOUND_${assets.length}_ASSETS`);
    for (const a of assets) {
      console.log(`ASSET: id=${a._id} name="${a.name}" images=${a.images?.length || 0} city="${a.location?.city || 'none'}"`);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
  }
}

main();

