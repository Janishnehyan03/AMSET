const { default: mongoose } = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, "Job vacancy title is required"],
    },
    vacancyId: {
      type: mongoose.Types.ObjectId,
      ref: "Vacancy",
      required: [true, "Vacancy ID is required"],
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
