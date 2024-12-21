// Import the required modules
const express = require("express")
const router = express.Router()

// Import the Controllers

// Course Controllers Import
const {
    createArtImage,
    editArtImages,
    getAllArtImages,
    getArtImage,
    getArtistArtImages,
    deleteArtistImages
} = require("../controllers/ArtImages")


// Categories Controllers Import
const {
    showAllCategories,
    createCategory,
    categoryPageDetails,
} = require("../controllers/Category")

// Rating Controllers Import
const {
    createRating,
    getAverageRating,
    getAllRating,
} = require("../controllers/RatingAndReview")

const {
    updateCourseProgress
} = require("../controllers/CourseProgress");

// Importing Middlewares
const { auth, isArtist, isStudent, isAdmin, isArtist } = require("../middlewares/auth")

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can Only be Created by Instructors
router.post("/createArtImage", auth, isArtist, createArtImage)
// Get all Registered Courses
router.get("/getAllArtImages", getAllArtImages)
// Get Details for a Specific Courses
router.post("/getArtImage", getArtImage)
// Edit Course routes
router.post("/editArtImages", auth, isArtist, editArtImages)
// Get all Courses Under a Specific Instructor
router.get("/getArtistArtImages", auth, isArtist, getArtistArtImages)
// Delete a Course
router.delete("/deleteArtistImages", deleteArtistImages)

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin

// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router