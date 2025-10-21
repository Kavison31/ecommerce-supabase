// api/create-bucket.js (Node, CommonJS for Vercel)
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";
    if (!SERVICE_ROLE) return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE not set" });

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // check buckets
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets();
    if (listErr) {
      console.error("listBuckets err", listErr);
      return res.status(500).json({ error: listErr.message || listErr });
    }

    const bucketName = "prodoct-images";
    const exists = (buckets || []).some(b => b.name === bucketName);
    if (!exists) {
      const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, { public: true });
      if (error) {
        console.error("createBucket err", error);
        return res.status(500).json({ error: error.message || error });
      }
      return res.status(200).json({ created: true, bucket: data });
    }

    return res.status(200).json({ created: false, msg: "bucket exists" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
};
