import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Do strings ko timing-safe tareeke se compare karta hai (owner login ke liye)
const safeEqual = (a, b) => {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
};

export const register = async (req, res) => {
    try {
        const firstName = String(req.body.firstName || "").trim();
        const lastName = String(req.body.lastName || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const { password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };

        res.status(201).json({
            success: true,
            message: "Registration Successful",
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- Owner only: promote a user to admin, or demote an admin back to user ----

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be 'user' or 'admin'",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `${user.email} is now ${role}`,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { given_name, family_name, sub, email_verified } = payload;
        const email = String(payload.email || "").toLowerCase();

        if (!email || !email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google account email is not verified",
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                firstName: given_name || "Google",
                lastName: family_name || "User",
                email,
                googleId: sub,
                authProvider: "google",
            });
        } else if (!user.googleId) {
            user.googleId = sub;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password || typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const user = await User.findOne({ email });

        // Google se bane account me password hota hi nahi, to bcrypt.compare crash karta tha
        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ---- Owner login — separate endpoint, credentials come from .env ----

export const ownerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const { OWNER_EMAIL, OWNER_PASSWORD } = process.env;

        if (!OWNER_EMAIL || !OWNER_PASSWORD) {
            return res.status(500).json({
                success: false,
                message: "Owner account is not configured on the server",
            });
        }

        // Dono compare hone dete hain (short-circuit nahi), taaki timing se kuch pata na chale
        const emailOk = safeEqual(email, OWNER_EMAIL);
        const passwordOk = safeEqual(password, OWNER_PASSWORD);

        if (!(emailOk && passwordOk)) {
            return res.status(401).json({
                success: false,
                message: "Invalid owner credentials",
            });
        }

        const token = jwt.sign(
            { role: "owner" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Owner login successful",
            token,
            user: {
                firstName: "Owner",
                lastName: "",
                email,
                role: "owner",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};