import express from "express";
import {
    createReservation,
    getMyReservations,
    cancelMyReservation,
    getAllReservations,
    updateReservationStatus,
} from "../controllers/reservationController.js";
import { protect, isStaff } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReservation);
router.get("/my", protect, getMyReservations);
router.patch("/my/:id/cancel", protect, cancelMyReservation);

// Admin OR Owner
router.get("/", protect, isStaff, getAllReservations);
router.patch("/:id", protect, isStaff, updateReservationStatus);

export default router;