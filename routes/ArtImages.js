// Import the required modules
const express = require("express")
const router = express.Router()

// Import the Controllers

// ArtImage Controllers Import
const {
    createArtImage,
    editArtImage,
    getAllArtImages,
    getArtImage,
    getArtistArtImages,
    deleteArtistImage
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

// Importing Middlewares
const { auth, isArtist, isStudent, isAdmin, isBuyer } = require("../middlewares/auth")

// ********************************************************************************************************
//                                      ArtImage routes
// ********************************************************************************************************

// ArtImages can Only be Created by Artists
router.post("/createArtImage", auth, isArtist, createArtImage)
// Get all Registered ArtImages
router.get("/getAllArtImages", getAllArtImages)
// Get Details for a Specific ArtImages
router.post("/getArtImage", getArtImage)
// Edit ArtImage routes
router.post("/editArtImage", auth, isArtist, editArtImage)
// Get all ArtImages Under a Specific Artist
router.get("/getArtistArtImages", auth, isArtist, getArtistArtImages)
// Delete a ArtImage
router.delete("/deleteArtistImage", deleteArtistImage)

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
router.post("/createRating", auth, isBuyer, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router