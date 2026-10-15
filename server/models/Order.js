import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        dishId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        img: { type: String },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        razorpayOrderId: {
            type: String,
            index: true,
        },
        paymentId: {
            type: String,
        },
        status: {
            type: String,
            enum: ["created", "paid", "failed"],
            default: "created",
        },
        fulfillment: {
            type: String,
            enum: ["placed", "preparing", "ready", "delivered"],
            default: "placed",
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;