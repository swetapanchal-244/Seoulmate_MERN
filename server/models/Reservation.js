import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        tableNumber: { type: Number, required: true, min: 1 },
        guests: { type: Number, required: true, min: 1 },
        message: { type: String, trim: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

reservationSchema.index({ date: 1, tableNumber: 1, status: 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;