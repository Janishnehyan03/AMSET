const { default: mongoose } = require("mongoose");
const Chapter = require("../models/chapterModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");

exports.createChapter = async (req, res) => {
  try {
    const course = new Chapter(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find();
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getOneChapter = async (req, res) => {
  try {
    // Find the chapter and populate course and questions details
    let { courseId } = req.query;
    const chapter = await Chapter.findById(req.params.chapterId).populate(
      "questions"
    ); // Populate the questions

    if (!chapter) {
      return res.status(404).json({ message: "Chapter Not Found" });
    }
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course Not Found" });
      }
    }

    let videoUrl;

    // Check if the course is premium
    if (chapter.isPremium) {
      // If the course is premium, check if the user has access to it
      const user = await User.findById(req.user._id).select("courses");
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }

      // Check if the user has enrolled in the premium course

      if (req.user.isAdmin) {
        // User has access, include the videoUrl
        const chapterWithVideo = await Chapter.findById(
          req.params.chapterId
        ).select("videoUrl");

        videoUrl = chapterWithVideo.videoUrl;
      } else {
        const isEnrolled = chapter.purchasedUsers.includes(req.user._id);
        if (!isEnrolled) {
          return res.status(403).json({
            message: "You need to purchase the course to access this chapter",
          });
        } else {
          // User has access, include the videoUrl
          const chapterWithVideo = await Chapter.findById(
            req.params.chapterId
          ).select("videoUrl");
          videoUrl = chapterWithVideo.videoUrl;
        }
      }
    } else {
      // If the course is not premium, include the videoUrl
      const chapterWithVideo = await Chapter.findById(
        req.params.chapterId
      ).select("videoUrl");
      videoUrl = chapterWithVideo.videoUrl;
    }

    // Prepare the response including questions
    const response = {
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      isPublished: chapter.isPublished,
      position: chapter.position,
      questions: chapter.questions,
      isPremium: chapter.isPremium,
      notes: chapter.notes,
      // Include the questions in the response
      ...(videoUrl && { videoUrl }),
    };

    res.json(response);
  } catch (error) {
    console.log("====================================");
    console.log(error);
    console.log("====================================");
    res.status(500).json({ error: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!chapter) {
      return res.status(404).json({ error: "chapter not found" });
    }

    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createQuestions = async (req, res) => {
  try {
    console.log("Received questions:", req.body.questions); // Log the questions array

    const { id } = req.params;
    let { questions } = req.body;

    // Check if questions is an array and is not null
    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: "Questions must be an array" });
    }

    if (questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Questions array cannot be empty" });
    }

    const chapter = await Chapter.findByIdAndUpdate(
      id,
      { $push: { questions: { $each: questions } } },
      { new: true }
    );

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.json(chapter);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Edit Question Endpoint
exports.editQuestion = async (req, res) => {
  const { chapterId, questionId } = req.params; // Get chapterId and questionId from the URL
  const { questionText, options, correctAnswerIndex } = req.body; // Get the updated data from the body

  try {
    // Find the chapter by ID
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Find the question by ID and update it
    const questionIndex = chapter.questions.findIndex(
      (q) => q._id.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update the question
    chapter.questions[questionIndex] = {
      ...chapter.questions[questionIndex],
      questionText,
      options,
      correctAnswerIndex,
    };

    // Save the updated chapter
    await chapter.save();

    return res.status(200).json(chapter.questions[questionIndex]);
  } catch (error) {
    return res.status(500).json({ message: "Error editing question", error });
  }
};

exports.deleteQuestion = async (req, res) => {
  const { chapterId, questionId } = req.params;

  try {
    // Validate required parameters
    if (!chapterId) {
      return res.status(400).json({ message: "Chapter ID is required." });
    }
    if (!questionId) {
      return res.status(400).json({ message: "Question ID is required." });
    }

    // Find the chapter by ID
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found." });
    }

    // Find the question index in the questions array using questionId
    const questionIndex = chapter.questions.findIndex(
      (q) => q._id.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found." });
    }

    // Remove the question from the array
    chapter.questions.splice(questionIndex, 1);

    // Save the updated chapter
    await chapter.save();

    return res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    console.error("Error deleting question:", error.message);
    return res
      .status(500)
      .json({ message: "Error deleting question.", error: error.message });
  }
};

exports.completeChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { courseId } = req.query;

    // Convert IDs to ObjectId
    const chapterObjectId = new mongoose.Types.ObjectId(chapterId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const chapter = await Chapter.findById(chapterObjectId);
    if (!chapter || !chapter.questions || chapter.questions.length === 0) {
      return res
        .status(404)
        .json({ message: "Chapter not found or has no questions." });
    }

    const course = await Course.findOne({
      _id: courseObjectId,
      "chapters": chapterObjectId, // Correct way to query nested fields
    });
    if (!course) {
      return res.status(404).json({
        message: "Course not found or chapter is not part of this course.",
      });
    }

    const existingAnswers = user.answers.find(
      (answer) =>
        answer.chapterId.toString() === chapterObjectId.toString() &&
        answer.courseId.toString() === courseObjectId.toString()
    );

    if (existingAnswers) {
      return res.status(400).json({
        message: "You have already completed this chapter in this course.",
      });
    }

    const userAnswers = req.body.userAnswers;
    if (!Array.isArray(userAnswers)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing user answers." });
    }

    let correctAnswersCount = 0;

    chapter.questions.forEach((question) => {
      const userAnswer = userAnswers.find(
        (answer) => answer.questionId === question._id.toString()
      );

      if (
        userAnswer &&
        userAnswer.selectedOptionIndex === question.correctAnswerIndex
      ) {
        correctAnswersCount++;
      }
    });

    if (correctAnswersCount === chapter.questions.length) {
      user.answers.push({
        chapterId: chapterObjectId,
        courseId: courseObjectId,
        userAnswers,
      });
      user.completedChapters.push(chapterObjectId);

      const courseCoinEntry = user.courseCoins.find(
        (coin) => coin.courseId.toString() === courseObjectId.toString()
      );

      if (courseCoinEntry) {
        courseCoinEntry.coins += 100;
      } else {
        user.courseCoins.push({ courseId: courseObjectId, coins: 100 });
      }

      await user.save();

      return res.status(200).json({
        message: "Congratulations! You've earned 100 coins.",
        courseCoins: user.courseCoins,
      });
    } else {
      return res.json({
        message: "Some answers are incorrect. Try again.",
      });
    }
  } catch (error) {
    console.error("Error submitting answers:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while submitting your answers." });
  }
};
