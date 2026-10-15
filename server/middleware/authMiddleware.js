import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.role = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, invalid token",
        });
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

// Admin OR Owner — for actions both should be able to do
// (viewing reservations, viewing users, confirming/cancelling bookings).
export const isStaff = (req, res, next) => {
    if (req.role !== "admin" && req.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Staff access only",
        });
    }
    next();
};