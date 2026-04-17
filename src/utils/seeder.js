const mongoose = require("mongoose");
require("dotenv").config();
const { User, Venue } = require("../models");

// Pre-hashed password for "1qazxsw2"
// Using insertMany to bypass pre('save') hook — password is already hashed
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

  // Clear existing data
  await User.deleteMany({});
  await Venue.deleteMany({});
  console.log("Cleared users and venues");

  // Use insertMany to bypass the pre('save') bcrypt hook — password is already hashed
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
      venueName: "O Beach Club",
      password: HASHED_PW,
      role: "venue",
      isEmailVerified: true,
    },
  ]);

  console.log(`Admin created: ${admin.email}`);

  // Seed demo venue profile
  const venue = await Venue.create({
    user: venueUser._id,
    name: "O Beach Club",
    isActive: true,
  });

  // Link venue back to user (direct update — no pre-save hook on this field)
  await User.updateOne({ _id: venueUser._id }, { venueRef: venue._id });

  console.log(
    `Demo venue created: ${venue.name} (username: ${venueUser.username})`,
  );
  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("Admin login:   POST /api/v1/auth/admin/login");
  console.log("  email:       admin@promotercard.com");
  console.log("  password:    1qazxsw2");
  console.log("─────────────────────────────────────────");
  console.log("Venue login:   POST /api/v1/auth/venue/login");
  console.log("  username:    obeach");
  console.log("  password:    1qazxsw2");
  console.log("─────────────────────────────────────────");

  mongoose.disconnect();
};

seedDatabase();
