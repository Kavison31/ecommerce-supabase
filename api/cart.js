// /api/cart.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcfyqmwgzrphiaaqwrde.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY; // doit être la clé service role

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

module.exports = async function handler(req, res) {
  try {
    const { method } = req;
    // user_id passé en query pour GET et en body pour POST
    if (method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id requis' });

      const { data, error } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Aucun panier pour cet utilisateur' });

      return res.status(200).json(data);
    }

    if (method === 'POST') {
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id requis' });

      // Créer un nouveau panier
      const { data, error } = await supabase
        .from('cart')
        .insert([{ user_id }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json(data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Méthode ${method} non autorisée` });
  } catch (err) {
    console.error('Erreur /api/cart:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};
