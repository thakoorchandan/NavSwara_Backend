import Section from "../models/sectionModel.js";
import Product from "../models/productModel.js";

// Create or update a section
export const upsertSection = async (req, res) => {
  try {
    const { id, title, description, productIds, image, order, active } = req.body;
    let section;
    if (id) {
      section = await Section.findByIdAndUpdate(
        id,
        { title, description, productIds, image, order, active },
        { new: true, upsert: true }
      );
    } else {
      section = await Section.create({ title, description, productIds, image, order, active });
    }
    res.json({ success: true, section });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List all active sections (for frontend landing page)
export const listSections = async (req, res) => {
  try {
    const sections = await Section.find({ active: true })
      .sort({ order: 1 })
      .lean();

    // Optionally, populate products (for landing page)
    for (const section of sections) {
      section.products = await Product.find({ _id: { $in: section.productIds } });
    }

    res.json({ success: true, sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: list all sections
export const adminSections = async (req, res) => {
  try {
    const sections = await Section.find({}).sort({ order: 1 });
    res.json({ success: true, sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete section
export const deleteSection = async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Section deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
