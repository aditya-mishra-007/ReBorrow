import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from '../models/Asset';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB.');

    // 1. Delete unnecessary trial / test assets
    const testPattern = /test|trial|spoons|plastic jug/i;
    const deleteResult = await Asset.deleteMany({
      $or: [
        { name: { $regex: testPattern } },
        { description: { $regex: testPattern } },
      ],
    });
    console.log(`Deleted ${deleteResult.deletedCount} unnecessary trial/test assets.`);

    // 2. Curated updates for previous genuine assets that lacked images or complete data
    const updates: Record<string, any> = {
      'PlayStation 5': {
        images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80'],
        condition: 'Like New',
        brand: 'Sony',
        borrowingCostPerDay: 400,
        securityDeposit: 6000,
        ownerRating: 4.9,
        pickupInstructions: 'Pickup near Bandra West. Please bring a backpack or protective bag.',
        restrictions: 'HDMI and 2 DualSense controllers included. No digital games sharing.',
        specifications: { Storage: '825 GB SSD', Output: '4K 120Hz / 8K HDR', Controllers: '2 included' },
        location: {
          city: 'Mumbai',
          coordinates: { type: 'Point', coordinates: [72.8777, 18.9402] },
        },
      },
      'Mountain Bike': {
        images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80'],
        condition: 'Good',
        brand: 'Firefox Target 21S',
        borrowingCostPerDay: 200,
        securityDeposit: 1500,
        ownerRating: 4.8,
        pickupInstructions: 'Pickup in Indiranagar, Bangalore. Helmet and combination lock provided.',
        restrictions: 'Suitable for paved roads and light trails. Please clean chain before return.',
        specifications: { 'Gears': '21 Shimano', 'Brakes': 'Dual Disc', 'Wheel Size': '27.5 inch' },
        location: {
          city: 'Bangalore',
          coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
      },
      'Stand Mixer': {
        images: ['https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=800&q=80'],
        condition: 'Like New',
        brand: 'KitchenAid Artisan 4.8L',
        borrowingCostPerDay: 300,
        securityDeposit: 2500,
        ownerRating: 5.0,
        pickupInstructions: 'Available for pickup in Hauz Khas, Delhi. Includes whisk, dough hook, and flat beater.',
        restrictions: 'Wash attachments thoroughly by hand with warm soapy water after use.',
        specifications: { 'Bowl Capacity': '4.8 Litres', 'Power': '300W', 'Speeds': '10' },
        location: {
          city: 'Delhi',
          coordinates: { type: 'Point', coordinates: [77.1025, 28.7041] },
        },
      },
      'Portable Projector': {
        images: ['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80'],
        condition: 'Like New',
        brand: 'Anker Nebula Capsule II',
        borrowingCostPerDay: 350,
        securityDeposit: 3000,
        ownerRating: 4.9,
        pickupInstructions: 'Pickup in Kothrud, Pune. Comes in a padded travel case with HDMI cable and remote.',
        restrictions: 'Do not touch projection lens. Charge battery to full before returning.',
        specifications: { Resolution: '720p HD', Brightness: '200 ANSI Lumens', 'Battery Life': '2.5 Hours' },
        location: {
          city: 'Pune',
          coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] },
        },
      },
      'Study Table with Chair': {
        images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80'],
        condition: 'Good',
        brand: 'IKEA LINNMON / ADILS',
        borrowingCostPerDay: 100,
        securityDeposit: 800,
        ownerRating: 4.7,
        pickupInstructions: 'Pickup in Vasant Kunj, Delhi. Fits easily in an SUV or auto with folded rear seats.',
        restrictions: 'Use coasters for hot mugs. Do not drag across rough floor.',
        specifications: { 'Table Dimensions': '100 x 60 cm', 'Chair': 'Ergonomic Mesh Chair' },
        location: {
          city: 'Delhi',
          coordinates: { type: 'Point', coordinates: [77.1025, 28.7041] },
        },
      },
      'Wireless Keyboard': {
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
        condition: 'Like New',
        brand: 'Logitech MX Keys',
        borrowingCostPerDay: 120,
        securityDeposit: 800,
        ownerRating: 4.9,
        pickupInstructions: 'Pickup in Koramangala, Bangalore. Includes USB-C charging cable and Unifying receiver.',
        restrictions: 'Multi-device Bluetooth support (Mac / Windows / iOS / Android).',
        specifications: { Connectivity: 'Bluetooth + 2.4GHz', Backlight: 'Smart Proximity Sensor' },
        location: {
          city: 'Bangalore',
          coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
      },
      'Cordless Drill': {
        name: 'Bosch 18V Cordless Combi Drill',
        images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80'],
        condition: 'Good',
        brand: 'Bosch Professional GSB 180-LI',
        borrowingCostPerDay: 180,
        securityDeposit: 1200,
        ownerRating: 4.8,
        pickupInstructions: 'Pickup in Andheri East, Mumbai. Includes charger and bit set.',
        restrictions: 'Only use supplied bits. Do not drop tool.',
        specifications: { Voltage: '18V', Torque: '54 Nm', 'Chuck Size': '13mm' },
        location: {
          city: 'Mumbai',
          coordinates: { type: 'Point', coordinates: [72.8777, 18.9402] },
        },
      },
      '4-Person Camping Tent': {
        name: 'Quechua Waterproof 4-Person Tent',
        images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80'],
        condition: 'Good',
        brand: 'Decathlon Quechua MH100',
        borrowingCostPerDay: 220,
        securityDeposit: 1500,
        ownerRating: 4.8,
        pickupInstructions: 'Pickup in Hinjewadi, Pune. Compact carry bag with tent pegs and poles included.',
        restrictions: 'Ensure tent is completely dry before packing into bag to prevent mold.',
        specifications: { Capacity: '4 Persons (210 x 240 cm)', 'Waterproof Rating': '2000mm PU' },
        location: {
          city: 'Pune',
          coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] },
        },
      },
      'Pressure Washer': {
        name: 'Kärcher K3 High Pressure Cleaner',
        images: ['https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80'],
        condition: 'Good',
        brand: 'Kärcher K3 Compact',
        borrowingCostPerDay: 250,
        securityDeposit: 1500,
        ownerRating: 4.7,
        pickupInstructions: 'Pickup in Powai, Mumbai. Bring vehicle for easy transport.',
        restrictions: 'Connect to standard garden hose. Do not run dry without water supply.',
        specifications: { 'Max Pressure': '120 Bar', 'Flow Rate': '380 L/h', 'Hose Length': '6m' },
        location: {
          city: 'Mumbai',
          coordinates: { type: 'Point', coordinates: [72.8777, 18.9402] },
        },
      },
    };

    for (const [nameMatch, data] of Object.entries(updates)) {
      const res = await Asset.updateMany(
        { name: nameMatch },
        { $set: data }
      );
      console.log(`Updated "${nameMatch}": matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    // 3. Double-check any remaining assets with 0 images and delete any orphan test entries
    const noImages = await Asset.find({ $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] });
    console.log(`Assets with no images remaining: ${noImages.length}`);
    for (const a of noImages) {
      console.log(`Removing empty asset: ${a.name} (${a._id})`);
      await Asset.findByIdAndDelete(a._id);
    }

    const finalCount = await Asset.countDocuments();
    console.log(`Clean up finished! Total active, high-quality items in database: ${finalCount}`);

  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
