import jwt from "jsonwebtoken";
import User from "../models/usermodel.js";

export default async function authUser(req, res, next) {
  // Check for Authorization: Bearer <token>
  let token = req.headers.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  try {
    const { id, role } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id, role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
