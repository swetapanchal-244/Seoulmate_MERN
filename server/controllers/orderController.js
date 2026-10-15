import mongoose from "mongoose";
import Order from "../models/Order.js";

// Order sirf aage badh sakta hai. Ek step skip ya peeche nahi ja sakta.
const NEXT_STEP = {
    placed: "preparing",
    preparing: "ready",
    ready: "delivered",
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId, status: { $ne: "created" } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: "created" } })
            .populate("user", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- Staff only: order ko agle step pe le jao ----

export const updateOrderFulfillment = async (req, res) => {
    try {
        const { fulfillment } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Only paid orders can be updated",
            });
        }

        const current = order.fulfillment || "placed";

        if (NEXT_STEP[current] !== fulfillment) {
            return res.status(400).json({
                success: false,
                message: `Order is "${current}". Next step must be "${NEXT_STEP[current] || "none"}".`,
            });
        }

        order.fulfillment = fulfillment;
        await order.save();

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};