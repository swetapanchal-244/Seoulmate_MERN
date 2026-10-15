import crypto from "crypto";
import Razorpay from "razorpay";
import Dish from "../models/Dish.js";
import Order from "../models/Order.js";
import { sendOrderConfirmationEmail } from "../utils/mailer.js";
import User from "../models/User.js";

const getRazorpay = () => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys are missing in server .env");
    }
    return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
};

// Step 1: cart se order banao. Price hamesha DB se aata hai, client ke bheje amount pe bharosa nahi.
export const createPaymentOrder = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const dishIds = items.map((i) => i.dishId);
        const dishes = await Dish.find({ _id: { $in: dishIds }, isAvailable: { $ne: false } });
        const dishMap = new Map(dishes.map((d) => [String(d._id), d]));

        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const dish = dishMap.get(String(item.dishId));
            const quantity = Number(item.quantity);

            if (!dish) {
                return res.status(400).json({
                    success: false,
                    message: `"${item.name || "An item"}" is no longer available. Please remove it from cart.`,
                });
            }
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
                return res.status(400).json({ success: false, message: "Invalid quantity" });
            }

            orderItems.push({
                dishId: String(dish._id),
                name: dish.name,
                price: dish.price,
                quantity,
                img: dish.img,
            });
            totalAmount += dish.price * quantity;
        }

        const razorpay = getRazorpay();

        // Razorpay amount paise me leta hai (1 rupee = 100 paise)
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        });

        await Order.create({
            user: req.userId,
            items: orderItems,
            totalAmount,
            razorpayOrderId: rzpOrder.id,
            status: "created",
        });

        res.status(201).json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        });
    } catch (error) {
        console.error("createPaymentOrder error:", error);
        res.status(500).json({
            success: false,
            message: error?.error?.description || error.message,
        });
    }
};

// Step 2: payment ke baad signature verify karo, tabhi order "paid" hoga.
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment details" });
        }

        const order = await Order.findOne({
            razorpayOrderId: razorpay_order_id,
            user: req.userId,
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "paid") {
            return res.status(200).json({ success: true, message: "Already verified", order });
        }

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const valid =
            expected.length === razorpay_signature.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

        if (!valid) {
            order.status = "failed";
            await order.save();
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        order.status = "paid";
        order.paymentId = razorpay_payment_id;
        await order.save();

        const buyer = await User.findById(req.userId);
        if (buyer?.email) {
            sendOrderConfirmationEmail(buyer.email, order); // background me, await nahi
        }

        res.status(200).json({ success: true, message: "Payment verified, order placed", order });
    } catch (error) {
        console.error("verifyPayment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// User ne popup band kar diya ya payment fail hui
export const markPaymentFailed = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        await Order.updateOne(
            { razorpayOrderId: razorpay_order_id, user: req.userId, status: "created" },
            { status: "failed" }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};