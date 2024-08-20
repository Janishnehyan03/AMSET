const Vacancy = require("../models/vacancyModel");
const { protect, isAdmin } = require("../utils/middlewares");
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
    let data = await Vacancy.create(req.body);
    res.status(201).json({ message: "Job vacancy created", data });
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
      let vacancy = await Vacancy.findByIdAndUpdate(
        req.params.id,
        {
          imageUrl: cldRes.secure_url,
        },
        { new: true }
      );
      res.json(vacancy);
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
    let data = await Vacancy.find();
    res.status(200).json({ results: data.length, data });
  } catch (error) {
    res.status(400).json({ error });
  }
});

// PATCH route to update a vacancy by ID
router.patch("/:id", protect, isAdmin, async (req, res) => {
  try {
    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // return the updated document
        runValidators: true, // ensure schema validators are enforced
      }
    );

    if (!updatedVacancy) {
      return res.status(404).json({ message: "Vacancy not found" });
    }

    res.status(200).json({ message: "Vacancy updated", data: updatedVacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE route to remove a vacancy by ID
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndDelete(req.params.id);

    if (!vacancy) {
      return res.status(404).json({ message: "Vacancy not found" });
    }

    res.status(200).json({ message: "Vacancy deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
