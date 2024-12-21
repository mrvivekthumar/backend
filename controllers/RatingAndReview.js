const RatingAndReview = require("../models/RatingAndReview");
const ArtImages = require("../models/ArtImages");
const mongoose = require("mongoose");
const logger = require('../utils/logger');  // Adjust the path as needed

// createRating
exports.createRating = async (req, res) => {
    try {
        // get user id
        const userId = req.user.id;
        // fetch data from req body
        const { rating, review, artImagesId } = req.body;
        // check if user is enrolled or not
        const artImagesDetails = await ArtImages.findOne({
            _id: artImagesId,
            buyersEnrolled: { $elemMatch: { $eq: userId } },
        });

        if (!artImagesDetails) {
            return res.status(404).json({
                success: false,
                message: 'Buyers is not enrolled in the artImages',
            });
        }
        // check if user already reviewed the artImages
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            artImages: artImagesId,
        });
        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: 'ArtImages is already reviewed by the user',
            });
        }
        // create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            artImages: artImagesId,
            user: userId,
        });

        // update artImages with this rating/review
        const updatedArtImagesDetails = await ArtImages.findByIdAndUpdate(
            { _id: artImagesId },
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            { new: true }
        );
        logger.info(updatedArtImagesDetails);
        // return response
        return res.status(200).json({
            success: true,
            message: "Rating and Review created Successfully",
            ratingReview,
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
        // get artImages ID
        const artImagesId = req.body.artImagesId;
        // calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    artImages: new mongoose.Types.ObjectId(artImagesId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ]);

        // return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        // if no rating/Review exists
        return res.status(200).json({
            success: true,
            message: 'Average Rating is 0, no ratings given till now',
            averageRating: 0,
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// getAllRatingAndReviews
exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "artImages",
                select: "artImagesName",
            })
            .exec();
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
