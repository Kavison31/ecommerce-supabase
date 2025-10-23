// api/create-bucket.js
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";

    if (!SERVICE_ROLE) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE non défini." });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const bucketName = "product-images";

    // Vérifie si le bucket existe déjà
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) throw listErr;

    const exists = buckets.some(b => b.name === bucketName);

    if (!exists) {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      if (error) throw error;
      return res.status(200).json({ created: true, bucket: data });
    }

    return res.status(200).json({ created: false, msg: "Bucket déjà existant." });
  } catch (err) {
    console.error("Erreur create-bucket:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

