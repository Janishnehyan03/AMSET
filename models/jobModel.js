const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  jobType: {
    type: String,
    enum: ["Full-time", "Part-time", "Internship", "Contract", "Freelance"],
  },
  experienceLevel: { type: String },
  requirements: [String],
  companyLogo: { type: String },
  applicants: [
    {
      applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["Applied", "Interviewing", "Shortlisted", "Hired", "Rejected"],
        default: "Applied",
      },
    },
  ],
});

const Job = mongoose.model("Job", JobSchema);
module.exports = Job;
