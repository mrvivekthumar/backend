const express = require("express")
const router = express.Router()
const { auth, isArtist } = require("../middlewares/auth")
const {
  deleteAccount,
  updateProfile,
  getAllUserDetails,
  updateDisplayPicture,
  artistDashboard,
  getEnrolledArtImages
} = require("../controllers/Profile")

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************

// Delet User Account
router.delete("/deleteProfile", auth, deleteAccount)
router.put("/updateProfile", auth, updateProfile)
router.get("/getUserDetails", auth, getAllUserDetails)

// Get Enrolled Artist
router.get("/getEnrolledArtImages", auth, getEnrolledArtImages)
router.put("/updateDisplayPicture", auth, updateDisplayPicture)
router.get("/artistDashboard", auth, isArtist, artistDashboard)

module.exports = router