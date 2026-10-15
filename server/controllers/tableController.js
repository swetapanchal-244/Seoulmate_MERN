import TABLES from "../data/tables.js";
import { getBookedTableNumbers } from "../utils/tableBooking.js";

export const getTables = async (req, res) => {
    try {
        const { date, time } = req.query;

        if (!date || !time) {
            return res.status(200).json({
                success: true,
                tables: TABLES.map((t) => ({ ...t, available: true })),
            });
        }

        const booked = await getBookedTableNumbers(date, time);

        res.status(200).json({
            success: true,
            tables: TABLES.map((t) => ({
                ...t,
                available: !booked.has(t.tableNumber),
            })),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};