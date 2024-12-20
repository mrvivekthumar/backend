const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");
const logger = require("../utils/logger");

exports.contactUsController = async (req, res) => {
    const { email, firstname, lastname, message, phoneNo, countrycode } = req.body;
    logger.info("Contact form submitted:", req.body);
    try {
        const emailRes = await mailSender(
            email,
            "Your Data sent successfully",
            contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
        );
        logger.info("Email sent successfully:", emailRes.response);
        return res.json({
            success: true,
            message: "Email sent successfully",
        });
    } catch (error) {
        logger.error("Error occurred while sending email:", error.message);
        return res.json({
            success: false,
            message: "Something went wrong...",
        });
    }
};
