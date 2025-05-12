// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/usermodel.js";

export default async function authUser(req, res, next) {
  // we expect your front-end to send: headers: { token: <JWT> }
  const token = req.headers.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
