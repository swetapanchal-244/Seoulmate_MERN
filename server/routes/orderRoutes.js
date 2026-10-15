import express from "express";
import { getMyOrders, getAllOrders, updateOrderFulfillment } from "../controllers/orderController.js";
import { protect, isStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyOrders);
router.get("/", protect, isStaff, getAllOrders);
router.patch("/:id/status", protect, isStaff, updateOrderFulfillment);

export default router;