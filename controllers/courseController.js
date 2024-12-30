const { default: mongoose } = require("mongoose");
const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");

exports.createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
exports.getCourses = async (req, res) => {
    try {
        const coursesWithChapters = await Course.aggregate([
            {
                $match: { deleted: { $ne: true } },
            },
            {
                $lookup: {
                    from: "chapters",
                    localField: "_id",
                    foreignField: "course",
                    as: "chapters",
                },
            },
            {
                $project: {
                    "chapters.videoUrl": 0, // Exclude the videoUrl field from chapters
                },
            },
        ]);

        res.json({
            results: coursesWithChapters.length,
            courses: coursesWithChapters,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('chapters.chapter').populate('learners.user')
        let chapters;
        if (req.user.isAdmin) {
            chapters = await Chapter.find({
                course: req.params.id,
            }).sort({
                position: 1,
            })
        } else {
            chapters = await Chapter.find({
                course: req.params.id,
                isPublished: true,
            }).sort({
                position: 1,
            })
        }
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json({ course, });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.reorderChapters = async (req, res) => {
    try {
        const list = req.body;

        if (!Array.isArray(list)) {
            return res.status(400).send("Invalid input format");
        }

        for (let item of list) {
            if (item._id && typeof item.position === "number") {
                await Chapter.findByIdAndUpdate(item._id, { position: item.position }, { new: true });
            } else {
                console.error("Invalid item format:", item);
            }
        }

        return res.status(200).send("Success");
    } catch (error) {
        console.error("[REORDER]", error);
        return res.status(500).send("Internal Error");
    }
};

exports.createChapter = async (req, res) => {
    try {
        const { title } = req.body;

        const lastChapter = await Chapter.findOne({ course: req.params.courseId }).sort({ position: -1 });
        const newPosition = lastChapter ? lastChapter.position + 1 : 1;

        const chapter = await Chapter.create({ title, course: req.params.courseId, position: newPosition });
        res.status(200).json(chapter);
    } catch (error) {
        console.error("[CHAPTERS]", error);
        res.status(500).send("Internal Error");
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findOneAndDelete({ _id: req.params.chapterId, courseId: req.params.courseId });

        if (!chapter) {
            return res.status(404).send("Not Found");
        }

        const publishedChaptersInCourse = await Chapter.find({
            courseId: req.params.courseId,
            isPublished: true,
        });

        if (!publishedChaptersInCourse.length) {
            await Course.updateOne({ _id: req.params.courseId }, { isPublished: false });
        }

        res.status(200).json(chapter);
    } catch (error) {
        console.error("[CHAPTER_ID_DELETE]", error);
        res.status(500).send("Internal Error");
    }
};

exports.updateChapter = async (req, res) => {
    try {
        const { isPublished, ...values } = req.body;
        const chapter = await Chapter.findOneAndUpdate(
            { _id: req.params.chapterId, course: req.params.courseId },
            { ...values },
            { new: true }
        );

        res.status(200).json(chapter);
    } catch (error) {
        console.error("[COURSES_CHAPTER_ID]", error);
        res.status(500).send("Internal Error");
    }
};
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { deleted: true },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.publishChapter = async (req, res) => {
    try {
        const { chapterId, courseId } = req.params;

        const chapter = await Chapter.findOne({ _id: chapterId, course: courseId });

        if (!chapter || !chapter.title || !chapter.description || !chapter.videoUrl) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const updatedChapter = await Chapter.findByIdAndUpdate(
            chapterId,
            { isPublished: true },
            { new: true }
        );

        res.json(updatedChapter);
    } catch (error) {
        console.log("[CHAPTER_PUBLISH]", error);
        res.status(500).json({ message: "Internal Error" });
    }
};

exports.amsetRecommended = async (req, res) => {
    const { courseId } = req.params;  // Get courseId from the request params

    try {
        // Find users where any courseCoins object has coins equal to 300 and matches the provided courseId
        const users = await User.find({
            "courseCoins.coins": { $gte: 300 },
            "courseCoins.courseId": courseId,
        }).populate({
            path: "courseCoins.courseId",
            select: "name description", // Select fields to include from the course
        }).select("fullName username mobileNumber courseCoins");
        console.log(users);
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
    console.log(req.body);

    const { courseId } = req.params;
    const { chapterId, isPremium } = req.body;

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

        // Check if the chapter is already part of the course
        const chapterExists = course.chapters.some((ch) => ch.chapter?.toString() === chapterId);
        if (chapterExists) {
            return res.status(400).json({ message: "Chapter is already part of this course" });
        }

        // Add the chapter to the course's chapters array
        course.chapters.push({ chapter: chapterId, isPremium: isPremium ?? true });
        await course.save();

        return res.status(200).json({
            message: "Chapter added to course successfully",
            course,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.applyForCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id; // Assume user ID is available in the request

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if the course is published
        if (!course.isPublished) {
            return res.status(400).json({ message: "Course is not yet published" });
        }

        // Check if the user is already enrolled
        const alreadyEnrolled = course.learners.some(learner => learner.user.toString() === userId.toString());
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "User is already enrolled in this course" });
        }

        // Add the user to the course
        course.learners.push({ user: userId, joinedOn: new Date() });
        await course.save();

        return res.status(200).json({
            message: "Successfully applied for the course",
            course,
        });
    } catch (error) {
        console.error("[APPLY_COURSE]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};