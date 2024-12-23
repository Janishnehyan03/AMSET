const { default: mongoose } = require("mongoose");

const vacancySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
    },
    imageUrl: {
      type: String,
    },
    VacancyCount: Number
  },
  { timestamps: true }
);

const Vacancy = mongoose.model("Vacancy", vacancySchema);
module.exports = Vacancy;
