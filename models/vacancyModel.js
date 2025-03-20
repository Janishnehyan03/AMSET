const { default: mongoose } = require("mongoose");

const vacancySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    jobNature: {
      type: String,
      required: [true, "Job nature is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    experience: {
      type: String,
      required: [true, "Experience is required"],
    },
    imageUrl: {
      type: String,
    },
    VacancyCount: Number,
  },
  { timestamps: true }
);

const Vacancy = mongoose.model("Vacancy", vacancySchema);
module.exports = Vacancy;
