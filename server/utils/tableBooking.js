import Reservation from "../models/Reservation.js";

export const SLOT_MINUTES = 120; // itne minute k liye table busy

export const toMinutes = (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return h * 60 + m;
};

export const getBookedTableNumbers = async (date, time) => {
    const active = await Reservation.find({
        date,
        status: { $in: ["pending", "confirmed"] },
    }).select("tableNumber time");

    const wanted = toMinutes(time);
    const booked = new Set();

    for (const r of active) {
        if (Math.abs(toMinutes(r.time) - wanted) < SLOT_MINUTES) {
            booked.add(r.tableNumber);
        }
    }
    return booked;
}

// Server kisi bhi timezone me ho, "aaj" aur "abhi" hamesha India (IST) ke hisaab se nikalte hain
export const getIndiaNow = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());

    const get = (type) => parts.find((p) => p.type === type).value;

    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        minutes: Number(get("hour")) * 60 + Number(get("minute")),
    };
};

export const hasConflict = async (date, time, tableNumber, excludeId) => {
    const others = await Reservation.find({
        _id: { $ne: excludeId },
        date,
        tableNumber,
        status: { $in: ["pending", "confirmed"] },
    }).select("time");

    const wanted = toMinutes(time);

    return others.some((r) => Math.abs(toMinutes(r.time) - wanted) < SLOT_MINUTES);
};

const locks = new Map();

export const withTableLock = async (key, fn) => {
    const prev = locks.get(key) || Promise.resolve();

    let release;
    const next = new Promise((resolve) => {
        release = resolve;
    });

    const chain = prev.then(() => next);
    locks.set(key, chain);

    await prev;

    try {
        return await fn();
    } finally {
        release();
        if (locks.get(key) === chain) locks.delete(key);
    }
};