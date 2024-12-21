const ArtImages = require("../models/ArtImages");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const logger = require('../utils/logger');

// Method for updatingProfile Controller
exports.updateProfile = async (req, res) => {
	try {
		const {
			firstName = "",
			lastName = "",
			dateOfBirth = "",
			about = "",
			contactNumber = "",
			gender = "",
		} = req.body
		const id = req.user.id

		// Find the profile by id
		const userDetails = await User.findById(id);

		const profile = await Profile.findById(userDetails.additionalDetails)

		const user = await User.findByIdAndUpdate(id, {
			firstName,
			lastName,
		})
		await user.save()

		// Update the profile fields
		profile.dateOfBirth = dateOfBirth
		profile.about = about
		profile.contactNumber = contactNumber
		profile.gender = gender

		// Save the updated profile
		await profile.save()

		// Find the updated user details
		const updatedUserDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec()

		return res.json({
			success: true,
			message: "Profile updated successfully",
			updatedUserDetails,
		})
	} catch (error) {
		logger.error(error)
		return res.status(500).json({
			success: false,
			error: error.message,
		})
	}
}

// Method for deleting a profile
exports.deleteAccount = async (req, res) => {
	try {
		// TODO: Find More on Job Schedule
		// const job = schedule.scheduleJob("10 * * * * *", function () {
		//      console.log("The answer to life, the universe, and everything!");
		// });
		// console.log(job);

		const id = req.user.id;
		const user = await User.findById({ _id: id });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Associated Profile with the User
		await Profile.findByIdAndDelete({ _id: user.additionalDetails });
		// Now Delete User
		await User.findByIdAndDelete({ _id: id });
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		logger.error(error);
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully" });
	}
};

// Method for viewing a profile
exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		logger.info(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Method for updating a profile picture
exports.updateDisplayPicture = async (req, res) => {
	try {
		const displayPicture = req.files.displayPicture
		const userId = req.user.id
		const image = await uploadImageToCloudinary(
			displayPicture,
			process.env.FOLDER_NAME,
			1000,
			1000
		)
		logger.info(image)

		const updatedProfile = await User.findByIdAndUpdate(
			{ _id: userId },
			{ image: image.secure_url },
			{ new: true }
		)
		res.send({
			success: true,
			message: `Image Updated successfully`,
			data: updatedProfile,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		})
	}
};

exports.artistDashboard = async (req, res) => {
	try {
		const artImageDetails = await ArtImages.find({ artist: req.user.id });

		const artImageData = artImageDetails.map((artImage) => {
			const totalBuyersEnrolled = artImage.buyersEnrolled.length
			const totalAmountGenerated = totalBuyersEnrolled * artImage.price

			//create an new object with the additional fields
			const artImageDataWithStats = {
				_id: artImage._id,
				artImageName: artImage.artImageName,
				artImageDescription: artImage.artImageDescription,
				totalBuyersEnrolled,
				totalAmountGenerated,
			}
			return artImageDataWithStats
		})

		res.status(200).json({ artImages: artImageData });

	}
	catch (error) {
		logger.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
}
