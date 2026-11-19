import Reservation from "../models/Reservation.js";
import TABLES from "../data/tables.js";
import { getBookedTableNumbers, getIndiaNow, toMinutes, withTableLock } from "../utils/tableBooking.js";

const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const OPEN_MINUTES = 12 * 60;
const LAST_BOOKING_WEEKDAY = 22 * 60; 
const LAST_BOOKING_WEEKEND = 23 * 60 + 30; 

const formatMinutes = (m) => {
    const h24 = Math.floor(m / 60);
    const min = String(m % 60).padStart(2, "0");
    const suffix = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${min} ${suffix}`;
};

const getBookingWindow = (date) => {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay(); 
    const isWeekend = day === 5 || day === 6 || day === 0;
    return {
        open: OPEN_MINUTES,
        last: isWeekend ? LAST_BOOKING_WEEKEND : LAST_BOOKING_WEEKDAY,
    };
};

const isRealDate = (d) => {
    const parsed = new Date(`${d}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d;
};

export const createReservation = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").trim();
        const message = String(req.body.message || "").trim();
        const { date, time, tableNumber } = req.body;
        const guests = Number(req.body.guests);

        if (!name || !phone || !date || !time || !tableNumber || !req.body.guests) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (name.length > 60 || message.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Name or message is too long",
            });
        }

        if (!PHONE_REGEX.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid phone number",
            });
        }

        if (!DATE_REGEX.test(date) || !isRealDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date",
            });
        }

        if (!TIME_REGEX.test(time)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time",
            });
        }

        const bookingWindow = getBookingWindow(date);
        const wanted = toMinutes(time);

        if (wanted < bookingWindow.open || wanted > bookingWindow.last) {
            return res.status(400).json({
                success: false,
                message: `Bookings are accepted between ${formatMinutes(bookingWindow.open)} and ${formatMinutes(bookingWindow.last)} on this day`,
            });
        }

        const now = getIndiaNow();

        if (date < now.date) {
            return res.status(400).json({
                success: false,
                message: "You can't book a table in the past",
            });
        }

        if (date === now.date && toMinutes(time) <= now.minutes) {
            return res.status(400).json({
                success: false,
                message: "That time has already passed today",
            });
        }

        const table = TABLES.find((t) => t.tableNumber === Number(tableNumber));

        if (!table) {
            return res.status(400).json({
                success: false,
                message: "Invalid table selected",
            });
        }

        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid number of guests",
            });
        }

        if (guests > table.seats) {
            return res.status(400).json({
                success: false,
                message: `Table ${table.tableNumber} seats only ${table.seats} guests. Please pick a bigger table.`,
            });
        }

        const result = await withTableLock(`${date}:${table.tableNumber}`, async () => {
            const booked = await getBookedTableNumbers(date, time);

            if (booked.has(table.tableNumber)) {
                return { conflict: true };
            }

            const created = await Reservation.create({
                user: req.userId,
                name,
                phone,
                date,
                time,
                tableNumber: table.tableNumber,
                guests,
                message,
            });

            return { conflict: false, reservation: created };
        });

        if (result.conflict) {
            return res.status(409).json({
                success: false,
                message: `Table ${table.tableNumber} is already booked around this time. Please pick another table or time.`,
            });
        }

        res.status(201).json({
            success: true,
            message: "Reservation request received",
            reservation: result.reservation,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelMyReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            _id: req.params.id,
            user: req.userId,
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found",
            });
        }

        if (reservation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${reservation.status} reservation`,
            });
        }

        reservation.status = "cancelled";
        await reservation.save();

        res.status(200).json({ success: true, reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate("user", "firstName lastName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "confirmed", "cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be pending, confirmed or cancelled",
            });
        }

        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        if (reservation.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "This reservation is already cancelled and cannot be changed",
            });
        }

        reservation.status = status;
        await reservation.save();

        res.status(200).json({ success: true, reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};