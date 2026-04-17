const mongoose = require("mongoose");
require("dotenv").config();
const { User, Venue } = require("../models");

// password: Admin@2024
const ADMIN_PASSWORD_HASH = "$2a$08$cUQ3uMdbQjlyDF/dgn5mNuEt9fLJZqq8TaT9aKabrFuG5wND3/mPO";

// Seed data
const adminData = {
  fullName: "PromoterCard Admin",
  email: "admin@promotercard.com",
  username: "admin",
  password: ADMIN_PASSWORD_HASH,
  role: "admin",
  isEmailVerified: true,
};

// Demo venue (password: Venue@2024 — same hash for demo)
const demoVenueUser = {
  username: "obeach",
  venueName: "O Beach Club",
  password: ADMIN_PASSWORD_HASH,
  role: "venue",
  isEmailVerified: true,
};

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

  // Clear existing data
  await User.deleteMany({});
  await Venue.deleteMany({});
  console.log("Cleared users and venues");

  // Seed admin
  const admin = await User.create(adminData);
  console.log(`Admin created: ${admin.email} (username: ${admin.username})`);

  // Seed demo venue user
  const venueUser = await User.create(demoVenueUser);

  // Seed demo venue profile
  const venue = await Venue.create({
    user: venueUser._id,
    name: "O Beach Club",
    isActive: true,
  });

  // Link venue back to user
  venueUser.venueRef = venue._id;
  await venueUser.save();

  console.log(`Demo venue created: ${venue.name} (username: ${venueUser.username})`);
  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("Admin login:   POST /api/v1/auth/admin/login");
  console.log("  email:       admin@promotercard.com");
  console.log("  password:    Admin@2024");
  console.log("─────────────────────────────────────────");
  console.log("Venue login:   POST /api/v1/auth/venue/login");
  console.log("  username:    obeach");
  console.log("  password:    Admin@2024 (demo hash)");
  console.log("─────────────────────────────────────────");

  mongoose.disconnect();
};

seedDatabase();
