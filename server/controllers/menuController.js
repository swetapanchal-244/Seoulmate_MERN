import Dish from "../models/Dish.js";

// ---- Public: anyone can view the menu ----

export const getDishes = async (req, res) => {
    try {
        // Public menu me sirf available dishes dikhengi
        const dishes = await Dish.find({ isAvailable: { $ne: false } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, dishes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Staff ke liye: saari dishes (hidden wali bhi)
export const getAllDishesForStaff = async (req, res) => {
    try {
        const dishes = await Dish.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, dishes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDishById = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }

        res.status(200).json({ success: true, dish });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- Owner / Admin only ----

export const createDish = async (req, res) => {
    try {
        const { name, desc, longDesc, price, img, category, isAvailable } = req.body;

        if (!name || !desc || !price || !img) {
            return res.status(400).json({
                success: false,
                message: "Name, description, price and image are required",
            });
        }

        const dish = await Dish.create({
            name,
            desc,
            longDesc,
            price,
            img,
            category,
            isAvailable,
        });

        res.status(201).json({
            success: true,
            message: "Dish added to menu",
            dish,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }

        const { name, desc, longDesc, price, img, category, isAvailable } = req.body;

        if (name !== undefined) dish.name = name;
        if (desc !== undefined) dish.desc = desc;
        if (longDesc !== undefined) dish.longDesc = longDesc;
        if (price !== undefined) dish.price = price;
        if (img !== undefined) dish.img = img;
        if (category !== undefined) dish.category = category;
        if (isAvailable !== undefined) dish.isAvailable = isAvailable;

        await dish.save();

        res.status(200).json({
            success: true,
            message: "Dish updated",
            dish,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDish = async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);

        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }

        await dish.deleteOne();

        res.status(200).json({
            success: true,
            message: "Dish removed from menu",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};