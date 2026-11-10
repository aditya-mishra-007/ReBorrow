/**
 * seedData.ts
 * ------------------------------------------------------------------
 * Populates the database with 15 realistic demo assets owned by a
 * single demo user (Priya Sharma). Safe to re-run: existing assets
 * owned by the demo user are deleted before re-inserting, so you get
 * a clean, predictable dataset every time.
 *
 * Usage:
 *   npx ts-node -r dotenv/config src/scripts/seedData.ts
 *   (or via npm script if one is defined in package.json)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Asset from '../models/Asset';

// ---------------------------------------------------------------------------
// City locations (GeoJSON order: [longitude, latitude])
// ---------------------------------------------------------------------------
const CITIES = {
  Mumbai:    { city: 'Mumbai',    coords: [72.8777, 18.9402] as [number, number] },
  Delhi:     { city: 'Delhi',     coords: [77.1025, 28.7041] as [number, number] },
  Bangalore: { city: 'Bangalore', coords: [77.5946, 12.9716] as [number, number] },
  Chennai:   { city: 'Chennai',   coords: [80.2707, 13.0827] as [number, number] },
  Hyderabad: { city: 'Hyderabad', coords: [78.4867, 17.3850] as [number, number] },
  Pune:      { city: 'Pune',      coords: [73.8567, 18.5204] as [number, number] },
};

function makeLocation(loc: { city: string; coords: [number, number] }) {
  return {
    city: loc.city,
    coordinates: { type: 'Point' as const, coordinates: loc.coords },
  };
}

// ---------------------------------------------------------------------------
// Seed asset definitions
// ---------------------------------------------------------------------------
function getSeedAssets(ownerId: mongoose.Types.ObjectId) {
  return [
    // 1 — DeWalt Cordless Drill
    {
      name: 'DeWalt 20V Max Cordless Drill',
      description:
        'Professional-grade DeWalt 20V Max cordless drill in Like New condition. ' +
        'Includes two 2Ah lithium-ion battery packs, a 60-minute fast charger, a ' +
        '1/2-inch keyless chuck, and a fitted hard case. The drill features two ' +
        'variable-speed settings and 15 clutch positions, making it suitable for ' +
        'both precision screwdriving and heavy drilling into wood, metal, and masonry. ' +
        'Used only twice on a small home renovation project. Perfect for DIY ' +
        'enthusiasts or contractors tackling short-term jobs. Both batteries hold ' +
        'full charge. The bit set included covers the most common sizes.',
      category: 'Tools',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'DeWalt',
      borrowingCostPerDay: 150,
      securityDeposit: 1000,
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'],
      location: makeLocation(CITIES.Mumbai),
      specifications: {
        'Voltage': '20V Max',
        'Chuck Size': '1/2 inch',
        'Speed Settings': '2 (0–550 / 0–2000 RPM)',
        'Max Torque': '60 Nm',
        'Weight': '1.8 kg',
        'Battery Included': '2 × 2Ah',
      },
      restrictions: 'Return with fully charged batteries. Report any damage before returning.',
      pickupInstructions: 'Available weekdays 9 am–6 pm. Please carry a government-issued photo ID.',
    },

    // 2 — Canon EOS 90D DSLR
    {
      name: 'Canon EOS 90D DSLR Camera (Body + 18-135mm Lens)',
      description:
        'Canon EOS 90D in Like New condition, used for fewer than 10 shoots. ' +
        'Ships with the Canon EF-S 18-135mm f/3.5-5.6 IS USM kit lens, two LP-E6N ' +
        'batteries, a dual charger, 32 GB SD card, UV filter, and a padded ' +
        'Lowepro carry bag. The 32.5 MP APS-C sensor delivers exceptional detail ' +
        'even in low-light conditions. Features a fully articulating 3-inch ' +
        'touchscreen, 45-point all cross-type AF, and can shoot 4K video without ' +
        'crop. Ideal for portrait, event, and wildlife photography. Sensor and lens ' +
        'are free of dust, scratches, or fungus. Shutter count under 2,000.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'Canon',
      borrowingCostPerDay: 800,
      securityDeposit: 15000,
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'],
      location: makeLocation(CITIES.Bangalore),
      specifications: {
        'Sensor': '32.5 MP APS-C CMOS',
        'Autofocus Points': '45-point all cross-type',
        'Video': '4K UHD (no crop)',
        'Battery': 'LP-E6N (included ×2)',
        'Weight (body)': '701 g',
        'Shutter Count': '< 2,000',
      },
      restrictions:
        'No beach or rain environments without waterproof housing. ' +
        'Lens cap must be on when not shooting. Return in original bag.',
      pickupInstructions:
        'HSR Layout, Bangalore. Contact 24 hours in advance to arrange handover.',
    },

    // 3 — Bosch Pressure Washer
    {
      name: 'Bosch AQT 35-12 Pressure Washer',
      description:
        'Reliable Bosch AQT 35-12 1500W electric pressure washer in Good condition. ' +
        'Delivers 150 bar of maximum pressure (100 bar working) with a flow rate of ' +
        '5 L/min — powerful enough to clean driveways, vehicles, garden furniture, ' +
        'and exterior walls. Includes a high-pressure gun, 5-metre high-pressure hose, ' +
        'variable fan jet nozzle, and rotary nozzle for stubborn dirt. The on-board ' +
        'storage hook keeps accessories tidy. Hose shows minor scuff marks but ' +
        'functions perfectly. All seals recently replaced for the season. Tank rinses ' +
        'clean between uses. Easy plug-and-play — no plumber needed.',
      category: 'Tools',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Bosch',
      borrowingCostPerDay: 400,
      securityDeposit: 2000,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      location: makeLocation(CITIES.Pune),
      specifications: {
        'Motor Power': '1500 W',
        'Max Pressure': '150 bar',
        'Flow Rate': '5 L/min',
        'Hose Length': '5 m',
        'Weight': '7.5 kg',
      },
      restrictions:
        'Do not use with detergent other than Bosch-compatible solution. ' +
        'Flush with clean water after each use before returning.',
      pickupInstructions:
        'Kothrud, Pune. Weekend pickup preferred; weekday evenings by prior arrangement.',
    },

    // 4 — DJI Mini 3 Pro Drone
    {
      name: 'DJI Mini 3 Pro Drone (Fly More Combo)',
      description:
        'DJI Mini 3 Pro in Like New condition, only three flights recorded. This ' +
        'sub-250 g foldable drone requires no DGCA registration for recreational use. ' +
        'Fly More Combo includes two Intelligent Flight Batteries (34 min each), a ' +
        'charging hub, shoulder bag, and 64 GB microSD card. Features tri-directional ' +
        'obstacle avoidance, 4K/60fps video, 48 MP photos, and ActiveTrack 360°. ' +
        'RC-N1 remote controller included with phone holder. Firmware fully updated. ' +
        'All propellers in perfect condition; a spare set is also included. ' +
        'No visible scratches on body, gimbal, or camera lens.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'DJI',
      borrowingCostPerDay: 1200,
      securityDeposit: 25000,
      images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80'],
      location: makeLocation(CITIES.Delhi),
      specifications: {
        'Weight': '< 249 g',
        'Max Video': '4K @ 60fps',
        'Photo Resolution': '48 MP',
        'Flight Time': '34 min per battery',
        'Obstacle Avoidance': 'Tri-directional',
        'Range': 'Up to 12 km (open area)',
      },
      restrictions:
        'Must not fly in restricted/no-fly zones. Pilot must hold basic DGCA knowledge. ' +
        'Do not fly in rain or winds > 10 m/s. Any crash damage charged at full replacement cost.',
      pickupInstructions:
        'Dwarka, Delhi. Renter must demonstrate basic flight controls before takeoff.',
    },

    // 5 — Coleman 6-Person Camping Tent
    {
      name: 'Coleman Sundome 6-Person Camping Tent',
      description:
        'Spacious Coleman Sundome 6-person dome tent in Good condition. Fits two ' +
        'queen-size airbeds side by side with room for gear. The WeatherTec system ' +
        '(welded floors, inverted seams, patented corner welds) kept dry during three ' +
        'family camping trips in monsoon-adjacent conditions. Easy-to-follow colour-coded ' +
        'poles mean setup takes about 15 minutes solo. Includes factory rainfly, ground ' +
        'cloth, 12 stakes, two carry bags, and a repair kit. Mesh storage pockets on ' +
        'interior walls. Minor cosmetic scuff on one exterior pole clip; functionality ' +
        'unaffected. Cleaned and air-dried thoroughly after last use.',
      category: 'Sports',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Coleman',
      borrowingCostPerDay: 200,
      securityDeposit: 1500,
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80'],
      location: makeLocation(CITIES.Hyderabad),
      specifications: {
        'Capacity': '6 persons',
        'Floor Dimensions': '3.35 m × 3.05 m',
        'Center Height': '1.83 m',
        'Setup Time': '~15 minutes',
        'Weight': '11.1 kg',
        'Seasons': '3-season',
      },
      restrictions:
        'Do not use open flame inside tent. Return fully dry and clean. ' +
        'Stakes and groundsheet must all be returned.',
      pickupInstructions:
        'Gachibowli, Hyderabad. Can be dropped off within 5 km for Rs 100 extra (auto fare).',
    },

    // 6 — Nikon D750 + 50mm
    {
      name: 'Nikon D750 Full-Frame DSLR + 50mm f/1.8G Lens',
      description:
        'Nikon D750 full-frame DSLR in Good condition — the go-to camera for ' +
        'low-light portraits and events. Paired with the legendary Nikkor AF-S ' +
        '50mm f/1.8G prime lens, this setup shoots stunning bokeh wide open and ' +
        'razor-sharp stopped down. Includes two EN-EL15 batteries, a dual charger, ' +
        '64 GB SD card, UV filter, and a Lowepro Flipside 300 backpack. Sensor ' +
        'recently cleaned by a Nikon-authorised service centre (receipt available). ' +
        'Body has minor wear marks around controls — purely cosmetic. Shutter count ' +
        'approximately 28,000. Flip-out LCD in perfect working order.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Nikon',
      borrowingCostPerDay: 600,
      securityDeposit: 12000,
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'],
      location: makeLocation(CITIES.Chennai),
      specifications: {
        'Sensor': '24.3 MP Full-Frame CMOS',
        'ISO Range': '100–12800 (expandable to 51200)',
        'Autofocus': '51-point Multi-CAM 3500FX II',
        'Video': '1080p Full HD',
        'Shutter Count': '~28,000',
        'Lens Included': 'Nikkor 50mm f/1.8G',
      },
      restrictions:
        'Sensor cleaning cloth provided — please do not use compressed air on sensor. ' +
        'No beach environments without waterproof housing.',
      pickupInstructions:
        'T. Nagar, Chennai. Metro reachable. Please call 1 hour before pickup.',
    },

    // 7 — Bosch Jigsaw
    {
      name: 'Bosch GST 90 BE Professional Jigsaw',
      description:
        'Bosch GST 90 BE 650W professional jigsaw in Like New condition, used on ' +
        'just one furniture-making project. Features a 90 mm cutting depth in wood ' +
        'and 8 mm in steel, plus a 4-stage pendulum action for faster cuts in softer ' +
        'materials. The dust blower keeps the cut line visible, and the low-vibration ' +
        'design reduces fatigue. Includes six T-shank blades covering wood, metal, ' +
        'and laminate, plus a parallel fence and anti-splinter insert. All accessories ' +
        'stored in the original Bosch carry case. Blade chuck lubricated. Cord and ' +
        'strain relief intact. Ready for immediate use.',
      category: 'Tools',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'Bosch',
      borrowingCostPerDay: 200,
      securityDeposit: 1500,
      images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80'],
      location: makeLocation(CITIES.Pune),
      specifications: {
        'Motor Power': '650 W',
        'Cutting Depth (wood)': '90 mm',
        'Cutting Depth (steel)': '8 mm',
        'Pendulum Settings': '4',
        'Blade Type': 'T-shank (universal)',
        'Weight': '2.3 kg',
      },
      restrictions:
        'Blades are sharp — handle with care. Return blades and all accessories. ' +
        'Do not use without the included anti-splinter insert on laminate surfaces.',
      pickupInstructions:
        'Wakad, Pune. Available 10 am–8 pm any day. WhatsApp preferred for scheduling.',
    },

    // 8 — Xbox Series X
    {
      name: 'Xbox Series X Console (1 TB)',
      description:
        'Microsoft Xbox Series X in Good condition. Perfect for a gaming weekend, ' +
        'house party, or trying out titles before committing to a purchase. Includes ' +
        'the console, two official Xbox wireless controllers (batteries included), ' +
        'HDMI 2.1 cable, power brick with international adapter, and a 1-month Game ' +
        'Pass Ultimate code redeemable by the renter. Supports 4K @ 120 fps, ' +
        'ray-tracing, and Dolby Vision. All original ports and expansion slot ' +
        'fully functional. Console has minor desk-rub marks on the top panel ' +
        'but no damage to ventilation or hardware. Quick Resume and instant-on ' +
        'modes working perfectly.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Microsoft',
      borrowingCostPerDay: 500,
      securityDeposit: 5000,
      images: ['https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80'],
      location: makeLocation(CITIES.Bangalore),
      specifications: {
        'Storage': '1 TB NVMe SSD',
        'Max Resolution': '4K @ 120 fps',
        'Ray Tracing': 'Yes (DirectX 12 Ultimate)',
        'Optical Drive': 'Yes (4K UHD Blu-ray)',
        'Controllers Included': '2',
        'Game Pass Code': '1 month Ultimate (included)',
      },
      restrictions:
        'No physical disc damage — handle discs carefully. ' +
        'Do not move console while disc is spinning. Return with controllers and all cables.',
      pickupInstructions:
        'Koramangala, Bangalore. Evening handover preferred after 6 pm.',
    },

    // 9 — Folding Camping Chair Set
    {
      name: 'Folding Camping Chair Set — 4 Chairs',
      description:
        'Set of four Coleman Kickback Breeze folding camp chairs in Like New ' +
        'condition. Each chair features a durable 150D polyester seat with cup ' +
        'holder, padded armrests, and a carry strap for transport. Supports up to ' +
        '113 kg per chair. The powder-coated steel frame folds flat in seconds and ' +
        'fits compactly in the included carry bags (one per chair). Great for picnics, ' +
        'concerts, cricket matches, camping trips, or any outdoor gathering. Fabric ' +
        'is clean and free of stains, tears, or mildew. Frames have zero wobble — ' +
        'all locking joints are tight. Recently re-tested for safety.',
      category: 'Sports',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'Coleman',
      borrowingCostPerDay: 100,
      securityDeposit: 500,
      images: ['https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=800&q=80'],
      location: makeLocation(CITIES.Mumbai),
      specifications: {
        'Quantity': '4 chairs',
        'Weight Capacity': '113 kg per chair',
        'Chair Weight': '2.7 kg each',
        'Material': '150D polyester + powder-coated steel',
        'Folded Dimensions': '84 × 18 × 11 cm',
        'Cup Holder': 'Yes (built-in)',
      },
      restrictions:
        'Do not drag chairs on rough surfaces (scratches legs). ' +
        'All four chairs must be returned together.',
      pickupInstructions:
        'Andheri West, Mumbai. Can deliver within Andheri for Rs 50. Call to arrange.',
    },

    // 10 — Panasonic Lumix G7
    {
      name: 'Panasonic Lumix G7 Mirrorless Camera (16MP MFT)',
      description:
        'Panasonic Lumix G7 mirrorless camera body in Good condition with the ' +
        'Lumix G Vario 14-42mm f/3.5-5.6 II kit lens. The 16 MP Micro Four Thirds ' +
        'sensor produces sharp, detailed images, and 4K video capture at 30 fps lets ' +
        'you extract 8 MP stills from footage — a trick videographers love. The ' +
        'tilting 3-inch LCD makes it easy to shoot from high or low angles without ' +
        'awkward poses. Includes one DMW-BLC12 battery, charger, 32 GB U3 card, UV ' +
        'filter, and a padded bag. Minor paint wear on top controls; no structural ' +
        'damage. Sensor clean, lens free of fungus or haze.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Panasonic',
      borrowingCostPerDay: 400,
      securityDeposit: 8000,
      images: ['https://images.unsplash.com/photo-1495121605193-b116b5b9c5a9?w=800&q=80'],
      location: makeLocation(CITIES.Hyderabad),
      specifications: {
        'Sensor': '16 MP Micro Four Thirds',
        'Video': '4K @ 30fps',
        'Lens Mount': 'Micro Four Thirds',
        'LCD': '3-inch tilting touchscreen',
        'Kit Lens': '14-42mm f/3.5-5.6 II',
        'SD Card Included': '32 GB (Class 10 U3)',
      },
      restrictions:
        'Return with lens cap and body cap. ' +
        'Do not change lenses in dusty or humid environments.',
      pickupInstructions:
        'Banjara Hills, Hyderabad. Flexible timing; just WhatsApp an hour before.',
    },

    // 11 — Trek Mountain Bike
    {
      name: 'Trek Marlin 5 Hardtail Mountain Bike (27.5")',
      description:
        'Trek Marlin 5 hardtail mountain bike in Good condition, recently ' +
        'serviced at a Trek dealer (invoice available). Features an Alpha Silver ' +
        'aluminium frame, SR Suntour XCT 100mm fork, Shimano 3 × 7 (21-speed) ' +
        'drivetrain, and mechanical disc brakes for confident stopping on descents. ' +
        'Tubeless-ready wheels fitted with knobby 27.5 × 2.2" Bontrager tyres — ' +
        'both holding air perfectly. Chain lubricated, brake pads at 60% life, ' +
        'cables fresh. Fits riders 165–180 cm (size M). Helmet not included but ' +
        'strongly recommended.',
      category: 'Sports',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Trek',
      borrowingCostPerDay: 300,
      securityDeposit: 3000,
      images: ['https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80'],
      location: makeLocation(CITIES.Bangalore),
      specifications: {
        'Frame': 'Alpha Silver Aluminium (size M)',
        'Fork': 'SR Suntour XCT, 100mm travel',
        'Drivetrain': 'Shimano 3×7 (21 speed)',
        'Brakes': 'Mechanical disc',
        'Wheels': '27.5 inch',
        'Rider Height': '165–180 cm',
      },
      restrictions:
        'Rider must be comfortable with geared bikes. No stunt riding or jumps. ' +
        'Return clean; excessive mud cleaning fee of Rs 100.',
      pickupInstructions:
        'Sarjapur Road, Bangalore. Available any morning 7–9 am for cyclists.',
    },

    // 12 — Aluminium Ladder
    {
      name: '6-Foot Aluminium Folding Step Ladder',
      description:
        'Sturdy 6-foot (183 cm) aluminium A-frame folding step ladder in Good ' +
        'condition. Rated for 100 kg working load. The wide, non-slip step treads ' +
        'and dual-side safety railings make it safe for changing bulbs, painting ' +
        'ceilings, cleaning fans, or accessing loft storage. The hinged spreader ' +
        'bars lock securely when open and the whole unit folds flat (about 10 cm ' +
        'thick) for easy car-boot transport. No wobble; all rivets tight. Rubber ' +
        'feet intact and in good grip condition. Weighs only 5 kg — one person can ' +
        'carry it comfortably.',
      category: 'Tools',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Bathla',
      borrowingCostPerDay: 80,
      securityDeposit: 500,
      images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'],
      location: makeLocation(CITIES.Delhi),
      specifications: {
        'Height': '6 feet (183 cm)',
        'Load Capacity': '100 kg',
        'Material': 'Aluminium',
        'Steps': '6',
        'Weight': '5 kg',
        'Folded Thickness': '~10 cm',
      },
      restrictions:
        'Do not use on wet or uneven surfaces without a spotter. ' +
        'Never stand on the top two rungs.',
      pickupInstructions:
        'Lajpat Nagar, Delhi. Metro accessible (Lajpat Nagar station, 5-min walk).',
    },

    // 13 — JBL Xtreme 3
    {
      name: 'JBL Xtreme 3 Portable Bluetooth Speaker',
      description:
        'JBL Xtreme 3 waterproof Bluetooth speaker in Like New condition. This ' +
        'big, bold party speaker delivers 100W of immersive ProSound with dual ' +
        'tweeters, four passive radiators, and dual bass radiators — loud enough ' +
        'for a 50-person outdoor gathering. IP67-rated (submersible up to 1 m) so ' +
        'poolside use is totally fine. Up to 15 hours of playtime per charge; charges ' +
        'via USB-C in about 2.5 hours. The detachable shoulder strap makes it easy ' +
        'to carry around. Pairs via Bluetooth 5.1 or Auracast multi-speaker link. ' +
        'Battery health at ~95%. Perfect for beach trips, house parties, or events.',
      category: 'Electronics',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Like New' as const,
      brand: 'JBL',
      borrowingCostPerDay: 150,
      securityDeposit: 1000,
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80'],
      location: makeLocation(CITIES.Mumbai),
      specifications: {
        'Output Power': '100 W',
        'Bluetooth Version': '5.1',
        'Battery Life': 'Up to 15 hours',
        'Waterproof Rating': 'IP67',
        'Charge Port': 'USB-C',
        'Weight': '2.3 kg',
      },
      restrictions:
        'Do not submerge beyond 1 m. Return fully charged. ' +
        'No modifications to EQ firmware; factory settings only.',
      pickupInstructions:
        'Bandra West, Mumbai. Available evenings 6–9 pm or by appointment.',
    },

    // 14 — Karrimor 65L Backpack
    {
      name: 'Karrimor Alpiniste 65L Hiking Backpack',
      description:
        'Karrimor Alpiniste 65-litre trekking backpack in Good condition, used on ' +
        'three Himalayan treks. The 65 L capacity easily handles 7-day expedition ' +
        'gear. Features a fully adjustable ACS Fit back system (torso length 40–50 cm), ' +
        'a removable top lid that doubles as a 5 L day pack, padded hip belt with ' +
        'map pockets, twin side pockets for water bottles, and a bottom-loading ' +
        'sleeping bag compartment. All zips smooth and sealed. Aluminium stays intact. ' +
        'Rain cover included (stored in its own pocket). Slight dirt marks on base — ' +
        'fully cleaned. No tears or frame damage.',
      category: 'Sports',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Karrimor',
      borrowingCostPerDay: 100,
      securityDeposit: 500,
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'],
      location: makeLocation(CITIES.Delhi),
      specifications: {
        'Capacity': '65 L',
        'Torso Fit Range': '40–50 cm (adjustable)',
        'Rain Cover': 'Included',
        'Top Lid': 'Removable (5 L day pack)',
        'Frame': 'Aluminium stays',
        'Weight': '2.1 kg',
      },
      restrictions:
        'Do not overload beyond 20 kg. ' +
        'Return with rain cover. Machine wash at 30°C if dirty; do not tumble dry.',
      pickupInstructions:
        'Karol Bagh, Delhi. Near Karol Bagh metro station. Doorstep delivery possible within 3 km.',
    },

    // 15 — Electric Lawn Mower
    {
      name: 'Bosch Rotak 37 Electric Lawn Mower',
      description:
        'Bosch Rotak 37 1400W corded electric lawn mower in Good condition, ' +
        'serviced and blade sharpened this season. The 37 cm cutting width covers ' +
        'a medium-sized lawn quickly; cutting height adjusts across six positions ' +
        '(20–70 mm). The 40-litre grass collection box avoids repeated trips to the ' +
        'compost heap, and the AeroSlice cutting system creates a clean, sharp edge. ' +
        'The foldable handle reduces storage footprint to half. Includes a 10-metre ' +
        'extension cable (heavy-duty outdoor-rated). Plastic body has light scratches ' +
        'but no structural cracks. Motor starts cleanly. Perfect for quarterly garden ' +
        'maintenance rentals.',
      category: 'Garden',
      owner: ownerId,
      status: 'available' as const,
      condition: 'Good' as const,
      brand: 'Bosch',
      borrowingCostPerDay: 250,
      securityDeposit: 1000,
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'],
      location: makeLocation(CITIES.Chennai),
      specifications: {
        'Motor Power': '1400 W',
        'Cutting Width': '37 cm',
        'Cutting Height': '20–70 mm (6 settings)',
        'Collection Box': '40 L',
        'Cable Included': '10 m outdoor extension',
        'Weight': '12.5 kg',
      },
      restrictions:
        'Corded — do not drag cable across sharp edges. ' +
        'Empty grass box before returning. Rinse underside of deck with water.',
      pickupInstructions:
        'Velachery, Chennai. Weekend-morning pickup preferred (grass cutting weather!). ' +
        'Advance booking required — only one unit available.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set in environment. Aborting.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  // 1. Upsert demo owner
  const demoEmail = 'priya@demo.com';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    console.log('Creating demo user: Priya Sharma…');
    // Hash password manually — bypassing the pre-save hook would require
    // calling User.create(), which triggers it automatically.
    demoUser = await User.create({
      name: 'Priya Sharma',
      email: demoEmail,
      password: 'Demo1234!',
      role: 'user',
    });
    console.log(`Demo user created: ${demoUser._id}`);
  } else {
    console.log(`Demo user already exists: ${demoUser._id}`);
  }

  // 2. Remove existing assets from this demo user for a clean slate
  const deleted = await Asset.deleteMany({ owner: demoUser._id });
  console.log(`Deleted ${deleted.deletedCount} existing demo assets.`);

  // 3. Insert all 15 fresh assets
  const seedData = getSeedAssets(demoUser._id as mongoose.Types.ObjectId);
  const created = await Asset.insertMany(seedData);
  console.log(`Seeded ${created.length} assets successfully.`);

  created.forEach((a) => console.log(`  • [${(a as unknown as { category: string }).category}] ${(a as unknown as { name: string }).name}`));

  await mongoose.disconnect();
  console.log('Done. MongoDB connection closed.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
