import mongoose from "mongoose";
import dotenv from "dotenv";
import Dish from "./models/Dish.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        const result = await Dish.updateMany({}, { $set: { rating: 0, numReviews: 0 } });
        console.log(`Ratings reset on ${result.modifiedCount} dishes`);

        process.exit(0);
    } catch (error) {
        console.error("Reset failed:", error.message);
        process.exit(1);
    }
};

run();