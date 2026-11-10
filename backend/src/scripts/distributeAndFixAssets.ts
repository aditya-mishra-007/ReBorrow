import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Asset from '../models/Asset';

// City reference centers [lng, lat]
const CITY_CENTERS: Record<string, [number, number]> = {
  Mumbai: [72.8777, 18.9402],
  Delhi: [77.1025, 28.7041],
  Bangalore: [77.5946, 12.9716],
  Pune: [73.8567, 18.5204],
  Hyderabad: [78.4867, 17.3850],
  Chennai: [80.2707, 13.0827],
};

// Generates nearby coordinates strictly within 1.0 to 4.2 km of the city center
function getViableCoordinates(city: string, seedIndex: number): [number, number] {
  const center: [number, number] = CITY_CENTERS[city] || CITY_CENTERS.Mumbai || [72.8777, 18.9402];
  const angles = [0.5, 1.2, 2.1, 3.4, 4.3, 5.2, 0.9, 2.8, 4.7];
  const angle = angles[seedIndex % angles.length] ?? 0.5;
  const distanceKm = 1.2 + ((seedIndex * 0.7) % 2.6);
  const degOffset = distanceKm / 111;

  const lng = Number((center[0] + degOffset * Math.cos(angle)).toFixed(5));
  const lat = Number((center[1] + degOffset * Math.sin(angle)).toFixed(5));
  return [lng, lat];
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB.');

    // 1. Create / Upsert 4 real community members (no 'demo' names or emails)
    const ownersData = [
      { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', rating: 4.9 },
      { name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', rating: 4.8 },
      { name: 'Neha Verma', email: 'neha.verma@gmail.com', rating: 5.0 },
      { name: 'Rohan Gupta', email: 'rohan.gupta@gmail.com', rating: 4.9 },
    ];

    const ownerDocs: mongoose.Types.ObjectId[] = [];
    for (const data of ownersData) {
      let user = await User.findOne({ email: data.email });
      if (!user) {
        user = await User.create({
          name: data.name,
          email: data.email,
          password: 'Password123!',
          role: 'user',
        });
        console.log(`Created community member: ${user.name} (${user.email})`);
      } else {
        console.log(`Community member exists: ${user.name} (${user.email})`);
      }
      ownerDocs.push(user._id as mongoose.Types.ObjectId);
    }

    // 2. Remove old demo user if exists
    const demoUser = await User.findOne({ email: 'priya@demo.com' });
    if (demoUser) {
      console.log('Cleaning up old demo user priya@demo.com...');
      await User.findByIdAndDelete(demoUser._id);
    }

    // 3. Fix Lumix G7 image specifically
    const lumixResult = await Asset.updateMany(
      { name: /Panasonic Lumix/i },
      {
        $set: {
          images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'],
          brand: 'Panasonic Lumix',
        },
      }
    );
    console.log(`Updated Lumix G7 photo: matched ${lumixResult.matchedCount}, modified ${lumixResult.modifiedCount}`);

    // 4. Distribute all assets across the 4 owners and tighten coordinates within <= 4.5 km of city center
    const allAssets = await Asset.find({});
    console.log(`Distributing ${allAssets.length} assets across 4 lenders...`);

    let idx = 0;
    for (const asset of allAssets) {
      const assignedOwnerId = ownerDocs[idx % ownerDocs.length]!;
      const city = asset.location?.city || 'Mumbai';
      const viableCoords = getViableCoordinates(city, idx);

      asset.owner = assignedOwnerId;
      asset.location = {
        city,
        coordinates: viableCoords,
      };

      // Ensure every image has optimized Unsplash params for speed
      if (asset.images && asset.images.length > 0) {
        asset.images = asset.images.map((img: string) => {
          if (img.includes('unsplash.com') && !img.includes('auto=format')) {
            return img.replace('?w=800&q=80', '?w=800&auto=format&fit=crop&q=80');
          }
          return img;
        });
      }

      await asset.save();
      idx++;
    }

    console.log(`Successfully distributed ${allAssets.length} assets across 4 real lenders!`);
    console.log('Coordinates calibrated strictly between 1.2 km and 3.8 km for viable neighborhood borrowing.');

  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

main();
