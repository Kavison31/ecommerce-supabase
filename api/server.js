import { createClient } from "@supabase/supabase-js";
import multer from "multer";

// --- Supabase ---
const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Multer pour gérer upload fichiers ---
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images");

// --- Handler pour Vercel ---
export default async function handler(req, res) {
  try {
    const { method } = req;
    const url = req.url;

    // Produits
    if (url.startsWith("/api/products")) {
      if (method === "GET") {
        // Lire tous les produits avec images
        const { data: products, error } = await supabase
          .from("products")
          .select(`*, product_images(path)`)
          .order("id", { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(products);
      }

      if (method === "POST") {
        // Upload produit + images
        upload(req, res, async (err) => {
          if (err) return res.status(500).json({ error: err.message });

          const { title, slug, description, price, category_id, subcategory_id, collection_id } = req.body;

          if (!title || !price) return res.status(400).json({ error: "Title et price requis" });

          // Insert produit
          const { data: prod, error: prodErr } = await supabase.from("products")
            .insert([{ title, slug, description, price: parseInt(price), published: true, category_id: category_id || null, subcategory_id: subcategory_id || null, collection_id: collection_id || null }])
            .select();
          if (prodErr) return res.status(500).json({ error: prodErr.message });

          // Upload images
          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              const filename = `${prod[0].id}_${Date.now()}_${file.originalname}`;
              const { error: uploadErr } = await supabase.storage.from("prodoct-images").upload(filename, file.buffer, { upsert: true });
              if (uploadErr) console.error("Erreur upload image:", uploadErr.message);
              else await supabase.from("product_images").insert([{ product_id: prod[0].id, path: filename }]);
            }
          }

          return res.status(200).json({ success: true, product: prod[0] });
        });
        return;
      }

      if (method === "PUT") {
        // Modifier produit
        upload(req, res, async (err) => {
          if (err) return res.status(500).json({ error: err.message });
          const { id, title, slug, description, price, category_id, subcategory_id, collection_id } = req.body;
          if (!id) return res.status(400).json({ error: "ID produit requis" });

          await supabase.from("products").update({ title, slug, description, price: parseInt(price), category_id: category_id || null, subcategory_id: subcategory_id || null, collection_id: collection_id || null }).eq("id", id);

          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              const filename = `${id}_${Date.now()}_${file.originalname}`;
              const { error: uploadErr } = await supabase.storage.from("prodoct-images").upload(filename, file.buffer, { upsert: true });
              if (uploadErr) console.error("Erreur upload image:", uploadErr.message);
              else await supabase.from("product_images").insert([{ product_id: id, path: filename }]);
            }
          }

          return res.status(200).json({ success: true });
        });
        return;
      }

      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis" });
        await supabase.from("products").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    // Categories / Subcategories / Collections
    if (url.startsWith("/api/categories")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("categories").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug } = req.body;
        if (!name) return res.status(400).json({ error: "Nom requis" });
        await supabase.from("categories").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis" });
        await supabase.from("categories").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    if (url.startsWith("/api/subcategories")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("subcategories").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug, category_id } = req.body;
        if (!name || !category_id) return res.status(400).json({ error: "Nom et category_id requis" });
        await supabase.from("subcategories").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), category_id }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis" });
        await supabase.from("subcategories").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    if (url.startsWith("/api/collections")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("collections").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug } = req.body;
        if (!name) return res.status(400).json({ error: "Nom requis" });
        await supabase.from("collections").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis" });
        await supabase.from("collections").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    res.status(404).json({ error: "Route non trouvée" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

