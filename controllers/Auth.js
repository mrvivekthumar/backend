const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();
const logger = require("../utils/logger");


// Signup Controller for Registering Users
exports.signup = async (req, res) => {
    try {
        // Destructure fields from the request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        logger.info("Received signup request:", { email });

        // Check if All Details are there or not
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            logger.error("All fields are required");
            return res.status(403).send({
                success: false,
                message: "All Fields are required",
            });
        }

        // Check if password and confirm password match
        if (password !== confirmPassword) {
            logger.error("Password and Confirm Password do not match");
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match. Please try again.",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.error("User already exists with email:", { email });
            return res.status(400).json({
                success: false,
                message: "User already exists. Please sign in to continue.",
            });
        }

        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        logger.info("Recent OTP found:", response);
        console.log(response);
        if (response.length === 0 || otp !== response[0].otp) {
            logger.error("Invalid OTP");
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const approved = accountType === "Artist" ? false : true;

        // Validate account type
        if (!["Artist", "Buyer"].includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account type provided.",
            });
        }

        // Create the Additional Profile For User
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstname:firstName,
            lastname:lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        logger.info("User registered successfully:", { email });
        return res.status(200).json({
            success: true,
            user,
            message: "User registered successfully",
        });
    } catch (error) {
        logger.error("Error registering user:", error);
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again.",
        });
    }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
    try {
        // Get email and password from request body
        const { email, password } = req.body;

        logger.info("Received login request:", { email });

        // Check if email or password is missing
        if (!email || !password) {
            logger.error("Email or password is missing");
            return res.status(400).json({
                success: false,
                message: "Please Fill up All the Required Fields",
            });
        }

        // Find user with provided email
        const user = await User.findOne({ email }).populate("additionalDetails");

        // If user not found with provided email
        if (!user) {
            logger.error("User not registered with email:", { email });
            return res.status(401).json({
                success: false,
                message: "User is not Registered with Us Please SignUp to Continue",
            });
        }

        // Generate JWT token and Compare Password
        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { email: user.email, id: user._id, accountType: user.accountType },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            // Save token to user document in database
            user.token = token;
            user.password = undefined;

            logger.info("Login successful:", { email });

            // Set cookie for token and return success response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            };
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User Login Success`,
            });
        } else {
            logger.error("Incorrect password for email:", { email });
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }
    } catch (error) {
        logger.error("Error logging in:", error);
        // Return 500 Internal Server Error status code with error message
        return res.status(500).json({
            success: false,
            message: "Login Failure Please Try Again",
        });
    }
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;

        logger.info("Sending OTP to email:", { email });

        // Check if user is already present
        // Find user with provided email
        const checkUserPresent = await User.findOne({ email });

        // If user found with provided email
        if (checkUserPresent) {
            logger.error("User already registered with email:", { email });
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            });
        }

        let otp;
        do {
            otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            logger.info("Generated OTP:", otp);
        } while (await OTP.findOne({ otp }));

        logger.info("Generated OTP:", otp);
        console.log(otp);

        logger.info("Result of OTP generation:");

        await OTP.create({ email, otp });

        logger.info("OTP Sent Successfully:", { email });

        return res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        });
    } catch (error) {
        logger.error("Error sending OTP:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id);

        // Get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        logger.info("Received change password request for email:", { email: userDetails.email });

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            logger.error("The password is incorrect for email:", { email: userDetails.email });
            return res
                .status(401)
                .json({ success: false, message: "The password is incorrect" });
        }

        // Match new password and confirm new password
        if (newPassword !== confirmNewPassword) {
            // If new password and confirm new password do not match, return a 400 (Bad Request) error
            logger.error("The password and confirm password does not match for email:", { email: userDetails.email });
            return res.status(400).json({
                success: false,
                message: "The password and confirm password does not match",
            });
        }

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        // Send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            logger.info("Email sent successfully to:", updatedUserDetails.email);
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            logger.error("Error occurred while sending email to:", updatedUserDetails.email, error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        // Return success response
        return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        logger.error("Error occurred while updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        });
    }
};
