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
const { addChapterToCourse, amsetRecommended, createCourse, getCourses, getCourse, updateCourse, reorderChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  publishChapter,
  deleteCourse,
  applyForCourse, } = require("../controllers/courseController");

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
router.post("/", protect, isAdmin, createCourse);

router.post("/:courseId/chapters", protect, isAdmin, addChapterToCourse);

// Get all (GET)
router.get("/", getCourses);
// Get a single course by ID (GET)
router.get("/:id", protect, getCourse);
router.get('/:courseId/amset-recommended', protect, isAdmin, amsetRecommended)
// Update a course by ID (PUT)
router.patch("/:id", protect, isAdmin, updateCourse);

router.patch("/:courseId/chapters/reorder", protect, reorderChapters);
// Delete a course by ID (DELETE)
router.delete("/:id", protect, isAdmin, deleteCourse);

router.post("/:courseId/chapters", protect, createChapter);

router.delete(
  "/:courseId/chapters/:chapterId",
  protect,
  isAdmin,
  deleteChapter
);


router.patch(
  "/:courseId/chapters/:chapterId",
  protect,
  isAdmin,
  updateChapter
);

router.patch(
  "/:courseId/chapters/:chapterId/publish",
  protect,
  isAdmin,
  publishChapter
);

router.post("/:courseId/apply", protect, applyForCourse);

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
router.post(
  '/upload-hiring-partners/:courseId',
  protect,
  isAdmin,
  upload.fields([{ name: 'companyLogo', maxCount: 1 }, { name: 'poster', maxCount: 1 }]),
  async (req, res) => {
    try {
      const companyLogoFile = req.files['companyLogo'] ? req.files['companyLogo'][0] : null;
      const posterFile = req.files['poster'] ? req.files['poster'][0] : null;

      let companyLogoUrl = null;
      let posterUrl = null;

      if (companyLogoFile) {
        const b64Logo = Buffer.from(companyLogoFile.buffer).toString('base64');
        let dataURILogo = 'data:' + companyLogoFile.mimetype + ';base64,' + b64Logo;
        const cldResLogo = await handleUpload(dataURILogo);
        companyLogoUrl = cldResLogo.secure_url;
      }

      if (posterFile) {
        const b64Poster = Buffer.from(posterFile.buffer).toString('base64');
        let dataURIPoster = 'data:' + posterFile.mimetype + ';base64,' + b64Poster;
        const cldResPoster = await handleUpload(dataURIPoster);
        posterUrl = cldResPoster.secure_url;
      }

      let updateData = {
        companyName: req.body.companyName,
      };

      if (companyLogoUrl) {
        updateData.companyLogo = companyLogoUrl;
      }

      if (posterUrl) {
        updateData.poster = posterUrl;
      }

      let course = await Course.findByIdAndUpdate(
        req.params.courseId,
        {
          $push: {
            hiringPartners: updateData,
          },
        },
        { new: true }
      );
      res.json(course);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: error.message,
      });
    }
  }
);
// create a remove hiring partner route
router.patch(
  '/remove-hiring-partner/:courseId',
  protect,
  isAdmin,
  async (req, res) => {
    try {
      let course = await Course.findByIdAndUpdate(
        req.params.courseId,
        {
          $pull: {
            hiringPartners: {
              _id: req.body.hiringPartnerId,
            },
          },
        },
        { new: true }
      );
      res.json(course);
    } catch (error) {
      console.log(error);
      res.status(500).send({
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
