import express from "express";
import {
    getDishes,
    getAllDishesForStaff,
    getDishById,
    createDish,
    updateDish,
    deleteDish,
} from "../controllers/menuController.js";
import { protect, isStaff } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public — anyone visiting the site can see the menu
router.get("/", getDishes);
router.get("/admin-all", protect, isStaff, getAllDishesForStaff);
router.get("/:id", getDishById);

// Owner / Admin only — upload a dish image, get back a URL to use in img field
router.post("/upload", protect, isStaff, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    res.status(200).json({
        success: true,
        imgUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    });
});

// Owner / Admin only — manage the menu
router.post("/", protect, isStaff, createDish);
router.put("/:id", protect, isStaff, updateDish);
router.delete("/:id", protect, isStaff, deleteDish);

export default router;