// /api/cart/items.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcfyqmwgzrphiaaqwrde.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY; // doit être la clé service role

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

module.exports = async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'POST') {
      // Ajouter un item au panier ou mettre à jour sa quantité
      const { cart_id, product_id, quantity } = req.body;
      if (!cart_id || !product_id || typeof quantity !== 'number') {
        return res.status(400).json({ error: 'cart_id, product_id et quantity requis' });
      }

      // Vérifier si l'item existe déjà
      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart_id)
        .eq('product_id', product_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return res.status(500).json({ error: fetchError.message });
      }

      let data, error;

      if (existingItem) {
        // Mettre à jour la quantité
        ({ data, error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', existingItem.id));
      } else {
        // Insérer nouvel item
        ({ data, error } = await supabase
          .from('cart_items')
          .insert([{ cart_id, product_id, quantity }]
        ));
      }

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json(data);
    }

    if (method === 'DELETE') {
      // Supprimer un item
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });

      const { error } = await supabase.from('cart_items').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ message: 'Item supprimé' });
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: `Méthode ${method} non autorisée` });
  } catch (err) {
    console.error('Erreur /api/cart/items:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};
