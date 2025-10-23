import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  try {
    const { paths } = req.body;
    if (!paths || !paths.length) return res.status(400).json({ error: "Aucun chemin fourni" });

    const results = [];
    for (const path of paths) {
      const { error } = await supabase.storage.from("product-images").remove([path]);
      results.push({ path, error: error?.message || null });
    }

    // Supprimer également les entrées de la table product_images si nécessaire
    // await supabase.from("product_images").delete().in("path", paths);

    res.status(200).json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

