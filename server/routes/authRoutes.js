import express from "express";
import {
    register,
    login,
    ownerLogin,
    getAllUsers,
    updateUserRole,
    googleAuth,
} from "../controllers/authController.js";
import { protect, isOwner, isStaff } from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/owner-login", ownerLogin);
router.get("/users", protect, isStaff, getAllUsers);
router.patch("/users/:id/role", protect, isOwner, updateUserRole);
router.post("/google", googleAuth);

export default router;