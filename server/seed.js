import mongoose from "mongoose";
import dotenv from "dotenv";
import Dish from "./models/Dish.js";

dotenv.config();

const DISHES = [
    {
        name: "Bibimbap",
        desc: "Stone-bowl rice, seasonal namul, gochujang, crisped egg.",
        longDesc: "A warm stone bowl of steamed rice topped with sautéed seasonal vegetables, a fried egg, and a spoon of gochujang chili paste. Mixed tableside so every bite carries a little of everything — crunch, heat, and umami.",
        price: 420,
        img: "/bibimbap.jpg",
    },
    {
        name: "Bulgogi",
        desc: "Charcoal-marinated ribeye, pear, sesame, scallion.",
        longDesc: "Thin-sliced ribeye marinated overnight in soy, pear, and sesame, then charcoal-grilled to a smoky char. Served with scallion and toasted sesame — sweet, savory, and tender enough to cut with a spoon.",
        price: 560,
        img: "/bulgogi.jpg",
    },
    {
        name: "Korean Fried Chicken",
        desc: "Double-fried, glazed in gochujang-honey lacquer.",
        longDesc: "Twice-fried for a shatter-crisp crust, then tossed in a sticky gochujang-honey glaze. Sweet, spicy, and impossible to stop eating — a Seoulmate favorite.",
        price: 480,
        img: "/fried-chicken.jpg",
    },
    {
        name: "Japchae",
        desc: "Glass noodles, shiitake, spinach, sesame oil.",
        longDesc: "Chewy sweet-potato glass noodles stir-fried with shiitake mushroom, spinach, and carrot in a light sesame-soy dressing. Naturally gluten-free and served warm.",
        price: 360,
        img: "/japchae.jpg",
    },
    {
        name: "Kimbap",
        desc: "Seaweed rolls, pickled radish, carrot, egg, spinach.",
        longDesc: "Seaweed rice rolls packed with pickled radish, carrot, egg, and spinach, sliced into bite-size pieces. Light, portable, and a lunchtime staple across Korea.",
        price: 280,
        img: "/kimbap.jpg",
    },
    {
        name: "House Kimchi",
        desc: "Fermented 21 days, napa cabbage, gochugaru.",
        longDesc: "Our own napa cabbage kimchi, fermented in-house for 21 days with gochugaru chili flake, garlic, and ginger. Tangy, funky, and the backbone of the menu.",
        price: 180,
        img: "/kimchi.jpg",
    },
    {
        name: "Spicy Ramyeon",
        desc: "Hand-pulled noodles, chashu, soft egg, chili oil.",
        longDesc: "Hand-pulled noodles in a fiery chili broth with slow-braised chashu pork, a soft-boiled egg, and a slick of chili oil on top. Built for cold nights.",
        price: 390,
        img: "/ramen.jpg",
    },
    {
        name: "Tteokbokki",
        desc: "Chewy rice cakes, fish cake, sweet-spicy gochujang.",
        longDesc: "Chewy cylindrical rice cakes simmered with fish cake in a sweet-spicy gochujang sauce. Street-food royalty in Seoul, served bubbling hot.",
        price: 320,
        img: "/tteokbokki.jpg",
    },
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        await Dish.deleteMany({});
        console.log("Old Dish collection cleared");

        const created = await Dish.insertMany(DISHES);
        console.log(`Seeded ${created.length} dishes`);

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

run();