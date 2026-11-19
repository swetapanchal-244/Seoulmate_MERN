import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token",
        });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, invalid token",
        });
    }

    try {
        // Owner DB me nahi hota (credentials .env se aate hain), to uske liye DB check nahi
        if (decoded.role === "owner") {
            req.userId = undefined;
            req.role = "owner";
            return next();
        }

        if (!decoded.id || !mongoose.isValidObjectId(decoded.id)) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, invalid token",
            });
        }

        // Role token se nahi, hamesha DB se. Isse demote/promote turant lagu hota hai.
        const user = await User.findById(decoded.id).select("role");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Account no longer exists",
            });
        }

        req.userId = String(user._id);
        req.role = user.role;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access only",
        });
    }
    next();
};

export const isOwner = (req, res, next) => {
    if (req.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Owner access only",
        });
    }
    next();
};

export const isStaff = (req, res, next) => {
    if (req.role !== "admin" && req.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Staff access only",
        });
    }
    next();
};