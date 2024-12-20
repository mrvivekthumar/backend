const { Mongoose } = require("mongoose");
const Category = require("../models/Category");
const logger = require("../utils/logger");

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
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

//categoryPageDetails 

exports.categoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;

        logger.info("Printing category ID:", categoryId);

        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec()

        if (!selectedCategory) {
            logger.info("Category not found.");
            return res
                .status(404)
                .json({ success: false, message: "Category not found" });
        }

        if (selectedCategory.courses.length === 0) {
            logger.info("No courses found for the selected category.");
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            });
        }

        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        });
        const differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        )
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec();

        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec();
        const allCourses = allCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
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
