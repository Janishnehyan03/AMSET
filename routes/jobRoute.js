const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController.js");
const { protect } = require("../utils/middlewares.js");

router.post("/", jobController.createJob);
router.post("/apply/:id", protect, jobController.applyForJob);
router.patch(
  "/:id/applications/:applicantId",
  protect,
  jobController.updateApplicationStatus
);
router.get("/", jobController.getAllJobs);
router.get("/:id", jobController.getJobById);
router.post("/save/:id", protect, jobController.saveJobToUser);
router.post("/unsave/:id", protect, jobController.unsaveJobFromUser);
router.put("/:id", jobController.updateJob);
router.delete("/:id", jobController.deleteJob);

module.exports = router;
