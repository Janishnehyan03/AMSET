const { default: mongoose } = require("mongoose");
const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");


exports.amsetRecommended = async (req, res) => {
    const { courseId } = req.params;  // Get courseId from the request params

    try {
        // Find users where any courseCoins object has coins equal to 300 and matches the provided courseId
        const users = await User.aggregate([
            {
                $match: {
                    "courseCoins.coins": 300, // Filter for coins equal to 300
                    "courseCoins.courseId": new mongoose.Types.ObjectId(courseId), // Filter by the provided courseId
                },
            },
            {
                $lookup: {
                    from: "courses", // Lookup to populate the courseId with course details
                    localField: "courseCoins.courseId",
                    foreignField: "_id",
                    as: "recommendedCourses", // This will create an array of recommended courses
                },
            },
            {
                $project: {
                    fullName: 1,          // Include fullName field
                    username: 1,          // Include username field
                    mobileNumber: 1,      // Include mobileNumber field
                    recommendedCourses: 1, // Include the entire array of recommendedCourses
                },
            },
        ]);

        if (!users.length) {
            return res.status(404).json({ message: "No recommended users found for this course." });
        }

        res.status(200).json(users); // Return the user data with recommended courses
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching recommended users." });
    }
};


exports.addChapterToCourse = async (req, res) => {
    const { courseId } = req.params;
    const { chapterId } = req.body;

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the chapter exists
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        // Add the chapter to the course's chapters array
        if (!course.chapters.includes(chapterId)) {
            course.chapters.push(chapterId);
            await course.save();
            return res.status(200).json({
                message: "Chapter added to course successfully",
                course,
            });
        } else {
            return res.status(400).json({
                message: "Chapter is already part of this course",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

