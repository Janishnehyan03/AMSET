// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoute = require("./routes/userRoute.js");
const courseRoute = require("./routes/courseRoute.js");
const categoryRoute = require("./routes/categoryRoute.js");
const chapterRoute = require("./routes/chapterRoute.js");
const orderRoute = require("./routes/orderRoute.js");
const jobRoute = require("./routes/jobRoute.js");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const globalErrorHandler = require("./utils/globalErrorHandler.js");
const AppError = require("./utils/AppError.js");

dotenv.config();
// Create an instance of Express
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));
app.use(
  cors({
    origin: [ // Specify allowed origins explicitly
      "http://localhost:5002", // Your frontend URL
      "https://amset-client.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Remove exposedHeaders: ["set-cookie"] unless you specifically need it
  })
);

// Handle preflight requests
app.options('*', cors()); // Enable preflight across all routes
app.use(cookieParser());

app.use("/api/user", userRoute);
app.use("/api/course", courseRoute);
app.use("/api/category", categoryRoute);
app.use("/api/chapter", chapterRoute);
app.use("/api/order", orderRoute);
app.use("/api/job", jobRoute);

app.get("/api", (req, res) => {
  let cookie = req.cookies.amset_token;
  res.json({ token: cookie });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

app.all("*", (req, res, next) => {
  next(new AppError(`This path ${req.originalUrl} isn't on this server!`, 404));
});
app.use(globalErrorHandler);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
