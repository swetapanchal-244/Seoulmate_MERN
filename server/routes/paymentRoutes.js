import express from "express";
import { createPaymentOrder, verifyPayment, markPaymentFailed } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);
router.post("/failed", protect, markPaymentFailed);

export default router;