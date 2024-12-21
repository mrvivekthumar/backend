const ArtImages = require("../models/ArtImages");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgess");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const logger = require("../utils/logger");

// Function to create a new artImages
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
            status,
        } = req.body;

        // Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage;

        const artImageFile = req.files.artImage;

        // Check if any of the required fields are missing
        if (
            !artImageName ||
            !artImageDescription ||
            !price ||
            !thumbnail ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory",
            });
        }
        // Check if the user is an instructor
        // const instructorDetails = await User.findById(userId, {
        //     accountType: "Instructor",
        // });

        const artistDetails = await User.findById(userId, {
            accountType: "Artist"
        });

        if (!artistDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details Not Found",
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

        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(
            thumbnail,
            process.env.FOLDER_NAME
        );


        // Upload the art image to Cloudinary
        const artImageUploaded = await uploadImageToCloudinary(artImageFile, process.env.FOLDER_NAME);

        logger.info(thumbnailImage);
        logger.info(artImageUploaded);


        // Create a new course with the given details
        const newArtImage = await ArtImages.create({
            artImageName,
            artImageDescription,
            artist: userId,
            artImage: artImageUploaded.secure_url,
            price,
            status: status || "Draft",
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
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

        // Return the new course and a success message
        res.status(200).json({
            success: true,
            data: newArtImage,
            message: "Course Created Successfully",
        });
    } catch (error) {
        // Handle any errors that occur during the creation of the course
        logger.error("Failed to create course", error);
        res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message,
        });
    }
};
// Edit Course Details


// exports.editCourse = async (req, res) => {
//     try {
//         const { courseId } = req.body;
//         const updates = req.body;
//         const course = await Course.findById(courseId);

//         if (!course) {
//             return res.status(404).json({ error: "Course not found" });
//         }

//         // If Thumbnail Image is found, update it
//         if (req.files) {
//             logger.info("thumbnail update");
//             const thumbnail = req.files.thumbnailImage;
//             const thumbnailImage = await uploadImageToCloudinary(
//                 thumbnail,
//                 process.env.FOLDER_NAME
//             );
//             course.thumbnail = thumbnailImage.secure_url;
//         }

//         // Update only the fields that are present in the request body
//         for (const key in updates) {
//             if (updates.hasOwnProperty(key)) {
//                 if (key === "tag" || key === "instructions") {
//                     course[key] = JSON.parse(updates[key]);
//                 } else {
//                     course[key] = updates[key];
//                 }
//             }
//         }

//         await course.save();

//         const updatedCourse = await Course.findOne({
//             _id: courseId,
//         })
//             .populate({
//                 path: "instructor",
//                 populate: {
//                     path: "additionalDetails",
//                 },
//             })
//             .populate("category")
//             .populate("ratingAndReviews")
//             .populate({
//                 path: "courseContent",
//                 populate: {
//                     path: "subSection",
//                 },
//             })
//             .exec();

//         res.json({
//             success: true,
//             message: "Course updated successfully",
//             data: updatedCourse,
//         });
//     } catch (error) {
//         logger.error("Internal server error", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };


// Get Course List

exports.getAllArtImages = async (req, res) => {
    try {
        const allArtImages = await ArtImages.find(
            { status: "Published" },

        )
            .populate("artist")
            .populate("category")
            .populate("ratingAndReviews")
            .exec();

        return res.status(200).json({
            success: true,
            data: allArtImages,
        });
    } catch (error) {
        logger.error("Can't Fetch Course Data", error);
        return res.status(404).json({
            success: false,
            message: `Can't Fetch Course Data`,
            error: error.message,
        });
    }
};
// Get One Single Course Details
exports.getArtImage = async (req, res) => {
    try {
        const { artImageId } = req.body;
        const artImage = await ArtImage.findOne({
            artImageId
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

        // console.log(
        //   "###################################### course details : ",
        //   courseDetails,
        //   courseId
        // );

        if (!artImage || !artImage.length) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        if (artImage.status === "Draft") {
            return res.status(403).json({
                success: false,
                message: `Accessing a draft course is forbidden`,
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

// exports.getCourseDetails = async (req, res) => {
//     try {
//         const { courseId } = req.body;
//         const courseDetails = await Course.findOne({
//             _id: courseId,
//         })
//             .populate({
//                 path: "instructor",
//                 populate: {
//                     path: "additionalDetails",
//                 },
//             })
//             .populate("category")
//             .populate("ratingAndReviews")
//             .populate({
//                 path: "courseContent",
//                 populate: {
//                     path: "subSection",
//                     select: "-videoUrl",
//                 },
//             })
//             .exec();

//         if (!courseDetails) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Could not find course with id: ${courseId}`,
//             });
//         }

//         // if (courseDetails.status === "Draft") {
//         //   return res.status(403).json({
//         //     success: false,
//         //     message: `Accessing a draft course is forbidden`,
//         //   });
//         // }

//         let totalDurationInSeconds = 0;
//         courseDetails.courseContent.forEach((content) => {
//             content.subSection.forEach((subSection) => {
//                 const timeDurationInSeconds = parseInt(subSection.timeDuration);
//                 totalDurationInSeconds += timeDurationInSeconds;
//             });
//         });

//         const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

//         return res.status(200).json({
//             success: true,
//             data: {
//                 courseDetails,
//                 totalDuration,
//             },
//         });
//     } catch (error) {
//         logger.error(error.message);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// exports.getFullCourseDetails = async (req, res) => {
//     try {
//         const { courseId } = req.body;
//         const userId = req.user.id;
//         const courseDetails = await Course.findOne({
//             _id: courseId,
//         })
//             .populate({
//                 path: "instructor",
//                 populate: {
//                     path: "additionalDetails",
//                 },
//             })
//             .populate("category")
//             .populate("ratingAndReviews")
//             .populate({
//                 path: "courseContent",
//                 populate: {
//                     path: "subSection",
//                 },
//             })
//             .exec();

//         let courseProgressCount = await CourseProgress.findOne({
//             courseID: courseId,
//             userId: userId,
//         });

//         console.log("courseProgressCount : ", courseProgressCount);

//         if (!courseDetails) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Could not find course with id: ${courseId}`,
//             });
//         }

//         // if (courseDetails.status === "Draft") {
//         //   return res.status(403).json({
//         //     success: false,
//         //     message: `Accessing a draft course is forbidden`,
//         //   });
//         // }

//         let totalDurationInSeconds = 0;
//         courseDetails.courseContent.forEach((content) => {
//             content.subSection.forEach((subSection) => {
//                 const timeDurationInSeconds = parseInt(subSection.timeDuration);
//                 totalDurationInSeconds += timeDurationInSeconds;
//             });
//         });

//         const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

//         return res.status(200).json({
//             success: true,
//             data: {
//                 courseDetails,
//                 totalDuration,
//                 completedVideos: courseProgressCount?.completedVideos
//                     ? courseProgressCount?.completedVideos
//                     : [],
//             },
//         });
//     } catch (error) {
//         logger.error(error.message);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// Get a list of Course for a given Instructor



// exports.getInstructorCourses = async (req, res) => {
//     try {
//         // Get the instructor ID from the authenticated user or request body
//         const instructorId = req.user.id;

//         // Find all courses belonging to the instructor
//         const instructorCourses = await Course.find({
//             instructor: instructorId,
//         }).sort({ createdAt: -1 });

//         // Return the instructor's courses
//         res.status(200).json({
//             success: true,
//             data: instructorCourses,
//         });
//     } catch (error) {
//         logger.error(error.message);
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve instructor courses",
//             error: error.message,
//         });
//     }
// };

// Delete the ArtImages
exports.deleteArtistImages = async (req, res) => {
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

