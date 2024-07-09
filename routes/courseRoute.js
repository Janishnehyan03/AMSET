const express = require("express");
const Course = require("../models/courseModel");
const Chapter = require("../models/chapterModel");
const { protect, isAdmin } = require("../utils/middlewares");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const router = express.Router();

router.use(cookieParser());

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const multer = require("multer");

const upload = multer({
  dest: "uploads/",
  storage: multer.memoryStorage(),
});

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

// Create a new course (POST)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all (GET)
router.get("/", protect, async (req, res) => {
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
    ]);

    res.json({
      results: coursesWithChapters.length,
      courses: coursesWithChapters,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get a single course by ID (GET)
router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    let chapters;
    if (req.user.isAdmin) {
      chapters = await Chapter.find({
        course: req.params.id,
      }).sort({
        position: 1,
      });
    } else {
      chapters = await Chapter.find({
        course: req.params.id,
        isPublished: true,
      }).sort({
        position: 1,
      });
    }
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({ course, chapters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a course by ID (PUT)
router.patch("/:id", protect, isAdmin, async (req, res) => {
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
});

router.patch("/:courseId/chapters/reorder", protect, async (req, res) => {
  try {
    const list = req.body;

    if (!Array.isArray(list)) {
      return res.status(400).send("Invalid input format");
    }

    // Update the position of each chapter
    for (let item of list) {
      if (item._id && typeof item.position === "number") {
        let chapter = await Chapter.findByIdAndUpdate(
          item._id,
          { position: item.position },
          { new: true }
        );
        console.log("Updated chapter:", chapter);
      } else {
        console.error("Invalid item format:", item);
      }
    }

    return res.status(200).send("Success");
  } catch (error) {
    console.error("[REORDER]", error);
    return res.status(500).send("Internal Error");
  }
});
// Delete a course by ID (DELETE)
router.delete("/:id", protect, isAdmin, async (req, res) => {
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
});

router.post("/:courseId/chapters", protect, async (req, res) => {
  try {
    const { title } = req.body;

    const lastChapter = await Chapter.findOne({
      course: req.params.courseId,
    }).sort({ position: -1 });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    // Create a new chapter
    const chapter = await Chapter.create({
      title,
      course: req.params.courseId,
      position: newPosition,
    });

    res.status(200).json(chapter);
  } catch (error) {
    console.error("[CHAPTERS]", error);
    res.status(500).send("Internal Error");
  }
});

router.delete(
  "/:courseId/chapters/:chapterId",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      const chapter = await Chapter.findOneAndDelete({
        _id: req.params.chapterId,
        courseId: req.params.courseId,
      });

      if (!chapter) {
        return res.status(404).send("Not Found");
      }

      const publishedChaptersInCourse = await Chapter.find({
        courseId: req.params.courseId,
        isPublished: true,
      });

      if (!publishedChaptersInCourse.length) {
        await Course.updateOne(
          {
            _id: req.params.courseId,
          },
          {
            isPublished: false,
          }
        );
      }

      res.status(200).json(chapter);
    } catch (error) {
      console.error("[CHAPTER_ID_DELETE]", error);
      res.status(500).send("Internal Error");
    }
  }
);

router.patch(
  "/:courseId/chapters/:chapterId",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      const { isPublished, ...values } = req.body;
      const chapter = await Chapter.findOneAndUpdate(
        {
          _id: req.params.chapterId,
          course: req.params.courseId,
        },
        {
          ...values,
        },
        {
          new: true,
        }
      );

      res.status(200).json(chapter);
    } catch (error) {
      console.error("[COURSES_CHAPTER_ID]", error);
      res.status(500).send("Internal Error");
    }
  }
);

router.patch(
  "/:courseId/chapters/:chapterId",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;

      // Check if the chapter exists and has all required fields
      const chapter = await Chapter.findOne({
        _id: chapterId,
        course: courseId,
      });

      if (
        !chapter ||
        !chapter.title ||
        !chapter.description ||
        !chapter.videoUrl
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Update the chapter's isPublished status
      const updatedChapter = await Chapter.findByIdAndUpdate(
        chapterId,
        { isPublished: true },
        { new: true } // Return the updated document
      );

      return res.json(updatedChapter);
    } catch (error) {
      console.log("[CHAPTER_PUBLISH]", error);
      return res.status(500).json({ message: "Internal Error" });
    }
  }
);

router.patch(
  "/:courseId/chapters/:chapterId/publish",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      // Extract courseId and chapterId from request params
      const { courseId, chapterId } = req.params;

      // Find the chapter
      const chapter = await Chapter.findOne({
        _id: chapterId,
        course: courseId,
      });

      // Check if the chapter exists and has required fields
      if (
        !chapter ||
        !chapter.title ||
        !chapter.description ||
        !chapter.videoUrl
      ) {
        return new NextResponse("Missing required fields", { status: 400 });
      }

      // Update the chapter's isPublished status
      const publishedChapter = await Chapter.findByIdAndUpdate(
        chapterId,
        { isPublished: true },
        { new: true } // Return the updated document
      );

      res.status(200).json({ message: "Chapter Published", publishedChapter });
    } catch (error) {
      console.log("[CHAPTER_PUBLISH]", error);
      res.status(400).json({ error: error.message });
    }
  }
);

router.patch(
  "/:courseId/chapters/:chapterId/unpublish",
  protect,
  isAdmin,
  async (req, res) => {
    try {
      // Update the chapter's isPublished status to false
      const unpublishedChapter = await Chapter.findOneAndUpdate(
        { _id: req.params.chapterId, course: req.params.courseId },
        { isPublished: false },
        { new: true } // Return the updated document
      );

      // Find published chapters in the course
      const publishedChaptersInCourse = await Chapter.find({
        course: req.params.courseId,
        isPublished: true,
      });

      // If there are no published chapters in the course, update the course's isPublished status to false
      if (!publishedChaptersInCourse.length) {
        await Course.findOneAndUpdate(
          { _id: req.params.courseId },
          { isPublished: false }
        );
      }

      res
        .status(200)
        .json({ message: "Chapter unpublished", unpublishedChapter });
    } catch (error) {
      console.log("[CHAPTER_UNPUBLISH]", error);
      res.status(400).json({ error: error.message });
    }
  }
);
// thumbnail upload
router.post(
  "/upload/:courseId",
  protect,
  isAdmin,
  upload.single("my_file"),
  async (req, res) => {
    try {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI);
      let course = await Course.findByIdAndUpdate(req.params.courseId, {
        imageUrl: cldRes.secure_url,
      });
      res.json(course);
    } catch (error) {
      console.log(error);
      res.send({
        message: error.message,
      });
    }
  }
);

router.patch("/:courseId/publish", protect, isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    const chapters = await Chapter.find({ course: course._id });
    if (!course) {
      return res.status(404).json({ message: "Not found" });
    }

    const hasPublishedChapter = chapters.some((chapter) => chapter.isPublished);

    if (
      !course.title ||
      !course.description ||
      !course.imageUrl ||
      !hasPublishedChapter
    ) {
      return res.status(401).json({ message: "Missing required fields" });
    }

    const publishedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { isPublished: true },
      { new: true }
    );

    return res.status(200).json(publishedCourse);
  } catch (error) {
    console.error("[COURSE_ID_PUBLISH]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
});
router.patch("/:courseId/unpublish", protect, isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Not found" });
    }

    const publishedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { isPublished: false },
      { new: true }
    );

    return res.json(publishedCourse);
  } catch (error) {
    console.error("[COURSE_ID_PUBLISH]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
});
module.exports = router;
