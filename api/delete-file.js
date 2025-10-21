// api/delete-file.js (Node, CommonJS)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";
    if (!SERVICE_ROLE) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE not set" });

    const { path } = req.body || {};
    if (!path) return res.status(400).json({ error: "path required" });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { error } = await supabaseAdmin.storage.from("prodoct-images").remove([path]);
    if (error) return res.status(500).json({ error: error.message || error });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
};
