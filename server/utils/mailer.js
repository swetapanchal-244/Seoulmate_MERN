import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
};

export const sendOrderConfirmationEmail = async (toEmail, order) => {
    const itemsList = order.items
        .map((i) => `${i.quantity} x ${i.name} - ₹${i.price * i.quantity}`)
        .join("\n");

    try {
        await getTransporter().sendMail({
            from: `"Seoulmate" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Your Seoulmate order is confirmed",
            text: `Thanks for your order!\n\n${itemsList}\n\nTotal: ₹${order.totalAmount}`,
        });
        console.log("Order confirmation email sent to", toEmail);
    } catch (error) {
        console.error("Order confirmation email failed:", error.message);
    }
};