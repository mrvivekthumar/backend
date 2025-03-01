const ArtImages = require("../models/ArtImages");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const logger = require("../utils/logger");
const { default: mongoose } = require("mongoose");

// Create a New artImages
exports.createArtImage = async (req, res) => {
    try {
        // Get user ID from request object
        const userId = req.user.id;

        // Get all required fields from request body
        const {
            artImageName,
            artImageDescription,
            price,
            category,
            status
        } = req.body;

        const artImageFile = req.files.artImage;

        // Check if any of the required fields are missing
        if (
            !artImageName ||
            !artImageDescription ||
            !price ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory",
            });
        }
        // Check if the user is an Artist
        // const artistDetails = await User.findById(userId, {
        //     accountType: "Artist",
        // });

        const artistDetails = await User.findById(userId, {
            accountType: "Artist"
        });

        if (!artistDetails) {
            return res.status(404).json({
                success: false,
                message: "Artist Details Not Found",
            });
        }

        // Check if the tag given is valid
        const categoryDetails = await Category.findById(category);

        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details Not Found",
            });
        }

        // Upload the art image to Cloudinary
        const artImageUploaded = await uploadImageToCloudinary(artImageFile, process.env.FOLDER_NAME);

        logger.info(artImageUploaded);

        // Create a new artImages with the given details
        const newArtImage = await ArtImages.create({
            artImageName,
            artImageDescription,
            artist: userId,
            artImage: artImageUploaded.secure_url,
            price,
            status: status || "Draft",
            category: categoryDetails._id,
        });

        // Add the new Image to the User Schema of the Artist
        await User.findByIdAndUpdate(
            {
                _id: artistDetails._id,
            },
            {
                $push: {
                    artImages: newArtImage._id,
                },
            },
            { new: true }
        );

        // Add the new artImages to the Categories
        const categoryDetails2 = await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    artImages: newArtImage._id,
                },
            },
            { new: true }
        );

        logger.info("HEREEEEEEEE", categoryDetails2);

        // Return the new artImages and a success message
        res.status(200).json({
            success: true,
            data: newArtImage,
            message: "ArtImages Created Successfully",
        });
    } catch (error) {
        // Handle any errors that occur during the creation of the artImages
        logger.error("Failed to create artImages", error);
        res.status(500).json({
            success: false,
            message: "Failed to create artImages",
            error: error.message,
        });
    }
};

// Edit ArtImages Details
exports.editArtImage = async (req, res) => {
    try {
        const { artImageId } = req.body;
        const updates = req.body;
        const artImages = await ArtImages.findById(artImageId);

        console.log("ARt Images id     ", artImageId);
        console.log("ARt Imagessdfdsf", artImages);

        if (!artImages) {
            return res.status(404).json({ error: "ArtImages not found" });
        }

        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {

                artImages[key] = updates[key];
            }
        }

        await artImages.save();

        const updatedArtImages = await ArtImages.findOne({
            _id: artImageId,
        })
            .populate("category")
            .populate("ratingAndReviews")
            .exec();

        res.json({
            success: true,
            message: "ArtImages updated successfully",
            data: updatedArtImages,
        });
    } catch (error) {
        logger.error("Internal server error", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Delete Artist ArtImages Details
exports.deleteArtistImage = async (req, res) => {
    try {
        const { artImageId } = req.body;

        // Find the artImage
        const artImage = await ArtImages.findByIdAndDelete(artImageId);

        if (!artImage) {
            return res.status(404).json({ message: "ArtImages not found" });
        }

        return res.status(200).json({
            success: true,
            message: "ArtImages deleted successfully",
        });
    } catch (error) {
        logger.error(error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// Get All ArtImages List
exports.getAllArtImages = async (req, res) => {
    try {
        const allArtImages = await ArtImages.find(
            { status: "Published" },
            {
                artImageName: true,
                price: true,
                artist: true,
                ratingAndReviews: true,
                buyersEnrolled: true,
            }
        )
            .populate("artist")
            .exec();

        return res.status(200).json({
            success: true,
            data: allArtImages,
        });
    } catch (error) {
        logger.error("Can't Fetch ArtImages Data", error);
        return res.status(404).json({
            success: false,
            message: `Can't Fetch ArtImages Data`,
            error: error.message,
        });
    }
};

// Get One Single ArtImages Details
exports.getArtImage = async (req, res) => {
    try {
        const { artImageId } = req.body;
        const artImage = await ArtImages.findOne({
            _id: new mongoose.Types.ObjectId(artImageId),
        })
            .populate({
                path: "artist",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .exec();

        console.log(
            "###################################### artImages details : ",
            artImageId
        );

        if (!artImage || !artImage.artImage) {
            return res.status(400).json({
                success: false,
                message: `Could not find artImages with id: ${artImageId}`,
            });
        }

        if (artImage.status === "Draft") {
            return res.status(403).json({
                success: false,
                message: `Accessing a draft artImages is forbidden`,
            });
        }

        return res.status(200).json({
            success: true,
            data: artImage,
        });
    } catch (error) {
        logger.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getArtistArtImages = async (req, res) => {
    try {
        // Get the Artist ID from the authenticated user or request body
        const artistId = req.user.id;

        // Find all artImages belonging to the Artist
        const artistArtImages = await ArtImages.find({
            artist: artistId,
        }).sort({ createdAt: -1 });

        // Return the artist's artImages
        res.status(200).json({
            success: true,
            data: artistArtImages,
        });
    } catch (error) {
        logger.error(error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve artist artImages",
            error: error.message,
        });
    }
};

// Get One Single ArtImage Details
exports.getArtImageDetails = async (req, res) => {
    try {
        const { artImageId } = req.body;

        logger.info("###################################### artImage id : ", artImageId);
        const artImageDetails = await ArtImages.findOne({
            _id: artImageId,
        })
            .populate({
                path: "artist",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "artImageContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();
        // console.log(
        //   "###################################### artImage details : ",
        //   artImageDetails,
        //   artImageId
        // );
        if (!artImageDetails || !artImageDetails.length) {
            return res.status(400).json({
                success: false,
                message: `Could not find artImage with id: ${artImageId}`,
            });
        }

        if (artImageDetails.status === "Draft") {
            return res.status(403).json({
                success: false,
                message: `Accessing a draft artImage is forbidden`,
            });
        }

        return res.status(200).json({
            success: true,
            data: artImageDetails,
        });
    } catch (error) {
        logger.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

