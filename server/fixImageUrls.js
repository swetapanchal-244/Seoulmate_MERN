import mongoose from "mongoose";
import dotenv from "dotenv";
import Dish from "./models/Dish.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        const dishes = await Dish.find({ img: /^https?:\/\/localhost/i });

        if (dishes.length === 0) {
            console.log("Koi localhost image URL nahi mila. Kuch karne ki zaroorat nahi.");
            process.exit(0);
        }

        console.log(`${dishes.length} dish(es) ka image URL badal raha hoon:\n`);

        for (const dish of dishes) {
            const fileName = dish.img.split("/").pop();
            const newImg = `/${fileName}`;

            await Dish.updateOne({ _id: dish._id }, { $set: { img: newImg } });

            console.log(`- ${dish.name}`);
            console.log(`  naya img: ${newImg}`);
            console.log(`  ab ye file copy karo: server\\uploads\\${fileName}  ->  client\\public\\${fileName}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Fix failed:", error.message);
        process.exit(1);
    }
};

run();