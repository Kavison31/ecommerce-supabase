import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "product-images";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.storage.createBucket(BUCKET, {
      public: true
    });
    if (error && error.message !== "The resource already exists") throw error;
    res.status(200).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

