const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Middleware to check if the user is logged in
const protect = async (req, res, next) => {
  const token =
    req?.cookies?.amset_token || req?.headers?.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  // Verify token (you need to implement this logic)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized:User not found in this token " });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  // Check if the user is an admin
  const { isAdmin } = req.user; // Assuming isAdmin is a property of the user object
  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden: Access denied" });
  }
  next();
};

module.exports = { protect, isAdmin };
