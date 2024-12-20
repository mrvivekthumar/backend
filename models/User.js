const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
            trim: true
        },
        lastname: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        accountType: {
            type: String,
            enum: ["Admin", "Artist", "Buyer"],
            required: true,
        },
        token: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        image: {
            type: String,
            required: true,
        },
        additionalDetails: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Profile",
        },
        artImages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ArtImages",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema)