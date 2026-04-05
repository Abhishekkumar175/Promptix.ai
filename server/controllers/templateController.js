import sql from "../configs/db.js";

// ─── GET /api/templates ─── List templates with optional category+search filter
export const getTemplates = async (req, res) => {
  try {
    const { category, q } = req.query;

    let templates;

    if (category && q) {
      templates = await sql`
        SELECT * FROM prompt_templates
        WHERE category = ${category}
          AND (title ILIKE ${"%" + q + "%"} OR description ILIKE ${"%" + q + "%"})
        ORDER BY usage_count DESC
      `;
    } else if (category) {
      templates = await sql`
        SELECT * FROM prompt_templates
        WHERE category = ${category}
        ORDER BY usage_count DESC
      `;
    } else if (q) {
      templates = await sql`
        SELECT * FROM prompt_templates
        WHERE title ILIKE ${"%" + q + "%"}
           OR description ILIKE ${"%" + q + "%"}
           OR ${q} = ANY(tags)
        ORDER BY usage_count DESC
      `;
    } else {
      templates = await sql`
        SELECT * FROM prompt_templates ORDER BY usage_count DESC
      `;
    }

    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/templates/categories ─── Get all unique categories
export const getCategories = async (req, res) => {
  try {
    const rows = await sql`
      SELECT DISTINCT category, COUNT(*) as count
      FROM prompt_templates
      GROUP BY category
      ORDER BY count DESC
    `;
    res.json({ success: true, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/templates/:id ─── Get single template
export const getTemplate = async (req, res) => {
  try {
    const [template] = await sql`
      SELECT * FROM prompt_templates WHERE id = ${req.params.id}
    `;
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/templates/:id/use ─── Track usage (increment counter)
export const useTemplate = async (req, res) => {
  try {
    await sql`
      UPDATE prompt_templates SET usage_count = usage_count + 1 WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
