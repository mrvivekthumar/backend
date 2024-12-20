const mongoose = require("mongoose");

const ArtImagesSchema = new mongoose.Schema(
    {
        artImageName: {
            type: String,
            required: true,
        },
        artImageDescription: {
            type: String
        },
        artist: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        ratingAndReviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "RatingAndReview",
            },
        ],
        artImage: {
            type: String,
        },
        price: {
            type: Number,
            min: [0, "Price cannot be negative"],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Category",
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    }
)

module.exports = mongoose.model("ArtImage", ArtImagesSchema);