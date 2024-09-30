const { protect, isAdmin } = require("../utils/middlewares");
const Job = require("../models/jobModel");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const router = require("express").Router();

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

router.post("/", protect, isAdmin, async (req, res) => {
  try {
    let data = await Job.create(req.body);
    res.status(201).json({ message: "Job created", data });
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post(
  "/upload/:id",
  protect,
  isAdmin,
  upload.single("my_file"),
  async (req, res) => {
    try {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI);
      let job = await Job.findByIdAndUpdate(
        req.params.id,
        {
          imageUrl: cldRes.secure_url,
        },
        { new: true }
      );
      res.json(job);
    } catch (error) {
      console.log(error);
      res.send({
        message: error.message,
      });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    let query;
    if (req.query) {
      query = req.query;
    }
    let data = await Job.find(query).populate("vacancyId");
    res.status(200).json({ results: data.length, data });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// PATCH route to update a job by ID
router.patch("/:id", protect, isAdmin, async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true, // ensure any schema validators are enforced
    });

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ message: "Job updated", data: updatedJob });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE route to remove a job by ID
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ message: "Job deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
