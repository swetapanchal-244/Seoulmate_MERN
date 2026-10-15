import mongoose from "mongoose";

const dishSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        desc: {
            type: String,
            required: true,
            trim: true,
        },

        longDesc: {
            type: String,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        img: {
            type: String,
            required: true,
        },

        category: {
            type: String,
            trim: true,
            default: "mains",
        },

        isAvailable: {
            type: Boolean,
            default: true,
        },

        rating: {
            type: Number,
            default: 0,
        },

        numReviews: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Dish = mongoose.model("Dish", dishSchema);

export default Dish;