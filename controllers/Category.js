const mongoose = require("mongoose");
const Category = require("../models/Category");
const logger = require("../utils/logger");

function getRandomInt(max) {
    return max > 0 ? Math.floor(Math.random() * max) : 0;
}

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }

        const CategorysDetails = await Category.create({
            name: name,
            description: description,
        });

        logger.info("Category created successfully:", CategorysDetails);

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        });

    } catch (error) {
        logger.error("Error occurred while creating category:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.showAllCategories = async (req, res) => {
    try {
        logger.info("Inside show all categories");

        const allCategories = await Category.find({});
        res.status(200).json({
            success: true,
            data: allCategories,
        });

    } catch (error) {
        logger.error("Error occurred while fetching categories:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.categoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;

        logger.info("Printing category ID:", categoryId);


        // Find the selected category by ID and populate the related artImages and ratingAndReviews
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "artImages",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec()

        // Handle case if category is not found
        if (!selectedCategory) {
            logger.info("Category not found.");
            return res
                .status(404)
                .json({ success: false, message: "Category not found" });
        }

        // Validate that artImages exist for the selected category
        if (selectedCategory.artImages.length === 0 || !Array.isArray(selectedCategory.artImages)) {
            logger.info("No artImages found for the selected category.");
            return res.status(404).json({
                success: false,
                message: "No artImages found for the selected category.",
            });
        }

        // Fetch other categories except the selected one
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        });

        // Check if there are any other categories to choose from
        let differentCategory = null;
        if (categoriesExceptSelected.length > 0) {
            differentCategory = await Category.findOne(
                categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
            )
                .populate({
                    path: "artImages",
                    match: { status: "Published" },
                })
                .exec();
        }

        // Get all categories with published artImages and their artists
        const allCategories = await Category.find()
            .populate({
                path: "artImages",
                match: { status: "Published" },
                populate: {
                    path: "artist",
                },
            })
            .exec();

        // Flatten all artImages and sort by most sold
        const allartImages = allCategories.flatMap((category) => category.artImages);


        const mostSellingartImages = allartImages
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingartImages,
            },
        });
    } catch (error) {
        logger.error("Internal server error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
