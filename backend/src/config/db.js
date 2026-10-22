import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env.");
  }

  mongoose.set("strictQuery", true); // Suppress deprecation warning for strict query filtering.
//what is strictQuery in mongoose
// strictQuery is a Mongoose option that controls whether queries are strictly filtered based on the schema.

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // Set a timeout for server selection to avoid hanging indefinitely.
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
