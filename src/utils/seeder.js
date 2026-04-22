const mongoose = require("mongoose");
require("dotenv").config();
const { User, Venue, Prize, Promoter, FormField } = require("../models");

// Pre-hashed password for "1qazxsw2"
const HASHED_PW =
  "$2a$08$cUQ3uMdbQjlyDF/dgn5mNuEt9fLJZqq8TaT9aKabrFuG5wND3/mPO";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  await connectDB();

  await User.deleteMany({});
  await Venue.deleteMany({});
  await Prize.deleteMany({});
  await Promoter.deleteMany({});
  await FormField.deleteMany({});
  console.log("Cleared users, venues, prizes, promoters and form fields");

  const [admin, venueUser] = await User.insertMany([
    {
      fullName: "PromoterCard Admin",
      email: "admin@promotercard.com",
      username: "admin",
      password: HASHED_PW,
      role: "admin",
      isEmailVerified: true,
    },
    {
      username: "obeach",
      email: "obeach@promotercard.com",
      venueName: "O Beach Club",
      password: HASHED_PW,
      role: "venue",
      isEmailVerified: true,
    },
  ]);

  console.log(`Admin created: ${admin.email}`);

  const venue = await Venue.create({
    user: venueUser._id,
    name: "O Beach Club",
    slug: "obeach",
    description: "The hottest beach club in town — sun, sea and good vibes.",
    gameType: "spin_wheel",
    isActive: true,
    pageTitle: "O Beach Club — Spin & Win",
    pageBlocks: [
      { id: "hero", type: "hero", label: "Hero Section", enabled: true, expanded: false, content: { headline: "Welcome to O Beach Club", subheadline: "Spin the wheel. Win amazing prizes!", heroImage: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800" } },
      { id: "event", type: "event", label: "Event Details", enabled: true, expanded: false, content: { venueName: "O Beach Club", date: "Every Friday & Saturday", time: "9PM – 4AM", location: "Ibiza, Spain" } },
      { id: "description", type: "description", label: "Description", enabled: true, expanded: false, content: { text: "Experience the ultimate beach club night. Tap your card, spin the wheel, and win exclusive prizes!" } },
      { id: "game", type: "game", label: "Prize Game", enabled: true, expanded: false, content: { reviewUrl: "", reviewPrompt: "Show this screen to a staff member to claim your prize!" } },
      { id: "social", type: "social", label: "Social Links", enabled: true, expanded: false, content: { instagram: "@obeachibiza", tiktok: "@obeach", whatsapp: "", website: "obeach.com" } },
      { id: "contact", type: "contact", label: "Contact Info", enabled: false, expanded: false, content: { phone: "", email: "info@obeach.com" } },
    ],
  });

  await User.updateOne({ _id: venueUser._id }, { venueRef: venue._id });

  // Default prizes
  await Prize.insertMany([
    { venue: venue._id, name: "Free Drink",   description: "One complimentary drink at the bar",   probabilityWeight: 30, maxWins: 0,  currentWins: 0, isActive: true,  sortOrder: 0 },
    { venue: venue._id, name: "10% Off",      description: "10% discount on your next order",      probabilityWeight: 25, maxWins: 0,  currentWins: 0, isActive: true,  sortOrder: 1 },
    { venue: venue._id, name: "VIP Table",    description: "Upgrade to a VIP table for the night", probabilityWeight: 10, maxWins: 5,  currentWins: 0, isActive: true,  sortOrder: 2 },
    { venue: venue._id, name: "Free Shot",    description: "A complimentary shot of your choice",  probabilityWeight: 20, maxWins: 0,  currentWins: 0, isActive: true,  sortOrder: 3 },
    { venue: venue._id, name: "Merch Pack",   description: "Exclusive O Beach Club merchandise",   probabilityWeight: 10, maxWins: 10, currentWins: 0, isActive: true,  sortOrder: 4 },
    { venue: venue._id, name: "Jackpot!",     description: "The big prize — ask the staff!",       probabilityWeight: 5,  maxWins: 2,  currentWins: 0, isActive: true,  sortOrder: 5 },
  ]);

  // Default form fields
  await FormField.insertMany([
    { venue: venue._id, label: "Full Name",    fieldKey: "name",  fieldType: "text",  placeholder: "Enter your full name",     isRequired: true,  isActive: true,  sortOrder: 0, options: [], isSystem: true  },
    { venue: venue._id, label: "Email",        fieldKey: "email", fieldType: "email", placeholder: "Enter your email address", isRequired: true,  isActive: true,  sortOrder: 1, options: [], isSystem: true  },
    { venue: venue._id, label: "Phone Number", fieldKey: "phone", fieldType: "phone", placeholder: "Enter your phone number",  isRequired: false, isActive: false, sortOrder: 2, options: [], isSystem: false },
  ]);

  // Demo promoters
  await Promoter.insertMany([
    { venue: venue._id, name: "Jake Miller",  nickname: "JakeMill", phone: "+44 7700 900001", email: "jake@example.com",  isActive: true  },
    { venue: venue._id, name: "Sofia Reyes",  nickname: "SofRey",   phone: "+44 7700 900002", email: "sofia@example.com", isActive: true  },
    { venue: venue._id, name: "Carlos Diaz",  nickname: "CDiaz",    phone: "+44 7700 900003", email: null,                isActive: true  },
    { venue: venue._id, name: "Mia Thompson", nickname: "MiaT",     phone: null,              email: "mia@example.com",  isActive: false },
  ]);

  console.log(`Demo venue created: ${venue.name} (slug: ${venue.slug})`);
  console.log("Seeded: 6 prizes, 3 form fields, 4 promoters");
  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("Admin login:   POST /api/v1/auth/admin/login");
  console.log("  email:       admin@promotercard.com");
  console.log("  password:    1qazxsw2");
  console.log("─────────────────────────────────────────");
  console.log("Venue login:   POST /api/v1/auth/venue/login");
  console.log("  username:    obeach  (or email: obeach@promotercard.com)");
  console.log("  password:    1qazxsw2");
  console.log("─────────────────────────────────────────");
  console.log("Public page:   GET /api/v1/venues/slug/obeach/published");
  console.log("─────────────────────────────────────────");

  mongoose.disconnect();
};

seedDatabase();
