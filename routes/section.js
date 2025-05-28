import express from "express";
import { upsertSection, listSections, adminSections, deleteSection } from "../controllers/sectioncontroller.js";
import adminAuth from "../middleware/adminauth.js";

const router = express.Router();

router.get("/list", listSections); // public for landing page
router.get("/admin", adminAuth, adminSections); // admin only

router.post("/upsert", adminAuth, upsertSection); // create/update
router.post("/delete", adminAuth, deleteSection); // admin only

export default router;
