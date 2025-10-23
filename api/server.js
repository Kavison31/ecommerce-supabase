// api/server.js
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

const SUPABASE_URL = "https://zcfyqmwgzrphiaaqwrde.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Configuration Multer (upload mémoire)
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images");

export default async function handler(req, res) {
  try {
    const { method, url } = req;

    // --------------------------
    // PRODUITS
    // --------------------------
    if (url.startsWith("/api/products")) {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("products")
          .select(`*, product_images(path), product_variants(*)`)
          .order("id", { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }

      if (method === "POST") {
        upload(req, res, async (err) => {
          if (err) return res.status(500).json({ error: err.message });
          const { title, slug, description, price, category_id, subcategory_id, collection_id, variants } = req.body;

          if (!title || !price) return res.status(400).json({ error: "Titre et prix sont requis." });

          // Créer le produit
          const { data: prod, error: prodErr } = await supabase
            .from("products")
            .insert([
              {
                title,
                slug,
                description,
                price: parseInt(price),
                published: true,
                category_id: category_id || null,
                subcategory_id: subcategory_id || null,
                collection_id: collection_id || null,
              },
            ])
            .select()
            .single();

          if (prodErr) return res.status(500).json({ error: prodErr.message });

          // Variantes
          if (variants) {
            try {
              const parsed = JSON.parse(variants);
              for (const variant of parsed) {
                await supabase.from("product_variants").insert([
                  {
                    product_id: prod.id,
                    name: variant.name,
                    sku: variant.sku,
                    additional_price: variant.additional_price || 0,
                    stock: variant.stock || 0,
                  },
                ]);
              }
            } catch {
              console.warn("Erreur parsing variantes");
            }
          }

          // Upload images
          if (req.files?.length > 0) {
            for (const file of req.files) {
              const filename = `${prod.id}_${Date.now()}_${file.originalname}`;
              const { error: uploadErr } = await supabase.storage
                .from("product-images")
                .upload(filename, file.buffer, { upsert: true });
              if (!uploadErr)
                await supabase.from("product_images").insert([{ product_id: prod.id, path: filename }]);
            }
          }

          return res.status(200).json({ success: true, product: prod });
        });
        return;
      }

      if (method === "PUT") {
        upload(req, res, async (err) => {
          if (err) return res.status(500).json({ error: err.message });

          const { id, title, slug, description, price, category_id, subcategory_id, collection_id, variants } = req.body;
          if (!id) return res.status(400).json({ error: "ID requis." });

          await supabase.from("products").update({
            title,
            slug,
            description,
            price: parseInt(price),
            category_id: category_id || null,
            subcategory_id: subcategory_id || null,
            collection_id: collection_id || null,
          }).eq("id", id);

          // Variantes (remplacer)
          if (variants) {
            const parsed = JSON.parse(variants);
            await supabase.from("product_variants").delete().eq("product_id", id);
            for (const variant of parsed) {
              await supabase.from("product_variants").insert([
                {
                  product_id: id,
                  name: variant.name,
                  sku: variant.sku,
                  additional_price: variant.additional_price || 0,
                  stock: variant.stock || 0,
                },
              ]);
            }
          }

          // Upload images
          if (req.files?.length > 0) {
            for (const file of req.files) {
              const filename = `${id}_${Date.now()}_${file.originalname}`;
              const { error: uploadErr } = await supabase.storage
                .from("product-images")
                .upload(filename, file.buffer, { upsert: true });
              if (!uploadErr)
                await supabase.from("product_images").insert([{ product_id: id, path: filename }]);
            }
          }

          return res.status(200).json({ success: true });
        });
        return;
      }

      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis." });
        await supabase.from("products").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    // --------------------------
    // CATÉGORIES
    // --------------------------
    if (url.startsWith("/api/categories")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("categories").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug } = req.body;
        if (!name) return res.status(400).json({ error: "Nom requis." });
        await supabase.from("categories").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis." });
        await supabase.from("categories").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    // --------------------------
    // SOUS-CATÉGORIES
    // --------------------------
    if (url.startsWith("/api/subcategories")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("subcategories").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug, category_id } = req.body;
        if (!name || !category_id)
          return res.status(400).json({ error: "Nom et catégorie requis." });
        await supabase.from("subcategories").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), category_id }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis." });
        await supabase.from("subcategories").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    // --------------------------
    // COLLECTIONS
    // --------------------------
    if (url.startsWith("/api/collections")) {
      if (method === "GET") {
        const { data, error } = await supabase.from("collections").select("*").order("id");
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
      if (method === "POST") {
        const { name, slug } = req.body;
        if (!name) return res.status(400).json({ error: "Nom requis." });
        await supabase.from("collections").insert([{ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }]);
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "ID requis." });
        await supabase.from("collections").delete().eq("id", id);
        return res.status(200).json({ success: true });
      }
    }

    // Aucune route correspondante
    return res.status(404).json({ error: "Route non trouvée." });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ error: error.message });
  }
}


