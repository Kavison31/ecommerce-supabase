// api/delete-file.js
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";

    if (!SERVICE_ROLE) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE non défini." });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { path } = req.body || {};

    if (!path) return res.status(400).json({ error: "Chemin de fichier requis." });

    const { error } = await supabase.storage.from("product-images").remove([path]);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur delete-file:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

