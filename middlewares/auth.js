const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// added a logging library 
const winston = require("winston");

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        // You can add more transports here, such as file, database, etc.
    ],
});

//auth
exports.auth = async (req, res, next) => {
    try {

        logger.info("BEFORE TOKEN EXTRACTION");
        //extract token
        const token = req.cookies.token
            || req.body.token
            || req.header("Authorization").replace("Bearer ", "");

        logger.info("AFTER TOKEN EXTRACTION");

        //if token missing, then return response
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing. Please log in.',
            });
        }

        //verify the token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            logger.info("Token decoded for user:", { email: decode.email, role: decode.accountType });
            req.user = decode;
        }
        catch (err) {
            //verification - issue
            if (err.name === "TokenExpiredError") {
                logger.error("Token has expired:", err);
                return res.status(401).json({
                    success: false,
                    message: 'Your session has expired. Please log in again.',
                });
            }
            
            logger.error("Token verification failed:", err);
            return res.status(401).json({
                success: false,
                message: 'token is invalid',
            });
        }
        next();
    }
    catch (error) {
        logger.error("Error validating token:", error);
        return res.status(401).json({
            success: false,
            message: 'Something went wrong while validating the token',
        });
    }
}

//isBuyer
exports.isBuyer = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Buyer") {
            return res.status(401).json({
                success: false,
                message: 'Access denied. This route is restricted to buyers only. Please ensure you are logged in as a buyer.',
            });
        }
        next();
    }
    catch (error) {
        logger.error("Error verifying buyer role:", error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again'
        })
    }
}


//isArtist
exports.isArtist = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Artist") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Artist only',
            });
        }
        next();
    }
    catch (error) {
        logger.error("Error verifying Artist role:", error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again'
        })
    }
}


//isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        logger.info("Printing AccountType ", req.user.accountType);
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Admin only',
            });
        }
        next();
    }
    catch (error) {
        logger.error("Error verifying admin role:", error);
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again'
        })
    }
}