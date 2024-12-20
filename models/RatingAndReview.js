const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    rating: {
        type: Number,
        required: true,
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"],
    },
    review: {
        type: String,
        required: true,
    },
    artImages: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "ArtImages",
        index: true,
    },
});

module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema);