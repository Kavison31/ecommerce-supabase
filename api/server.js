import express from "express";
import multer from "multer";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = "https://zcfyqmwgzrphiaaqwrde.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Stockée dans Vercel
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Multer setup pour gérer les uploads
const upload = multer({ dest: "/tmp" });

// Vérifier et créer le bucket si inexistant
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets.find(b => b.name === "prodoct-images")) {
    await supabase.storage.createBucket("prodoct-images", { public: true });
  }
}
ensureBucket();

// Endpoint pour ajouter ou modifier une image
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!req.file || !product_id) return res.status(400).json({ error: "Image et product_id requis" });

    const filePath = `${product_id}_${req.file.originalname}`;
    const fileBuffer = fs.readFileSync(req.file.path);

    const { error } = await supabase.storage.from("prodoct-images").upload(filePath, fileBuffer, { upsert: true });
    if (error) return res.status(500).json({ error: error.message });

    // Mettre à jour la table product_images
    await supabase.from("product_images").upsert({ product_id: parseInt(product_id), path: filePath });
    fs.unlinkSync(req.file.path); // Supprimer le fichier temporaire
    res.json({ success: true, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lancer le serveur
export default app;
