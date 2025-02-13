// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payments")
const { auth, isArtist, isBuyer, isAdmin } = require("../middlewares/auth")
router.post("/capturePayment", auth, isBuyer, capturePayment)
router.post("/verifyPayment", auth, isBuyer, verifyPayment)
router.post("/sendPaymentSuccessEmail", auth, isBuyer, sendPaymentSuccessEmail);

module.exports = router