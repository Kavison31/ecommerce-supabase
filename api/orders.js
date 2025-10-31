// /api/orders.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zcfyqmwgzrphiaaqwrde.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY; // doit être la clé service role

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

module.exports = async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'POST') {
      const { user_id, items } = req.body;
      if (!user_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'user_id et items sont requis' });
      }

      // Calculer total
      const productIds = items.map(i => i.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds);

      if (productsError) return res.status(500).json({ error: productsError.message });

      let total = 0;
      const priceMap = new Map(products.map(p => [p.id, p.price]));

      for (const item of items) {
        const price = priceMap.get(item.product_id);
        if (!price) {
          return res.status(400).json({ error: `Produit introuvable id ${item.product_id}` });
        }
        total += price * item.quantity;
      }

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ user_id, total }])
        .select()
        .single();

      if (orderError) return res.status(500).json({ error: orderError.message });

      // Créer les order_items
      const orderItemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: priceMap.get(item.product_id),
      }));

      const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (orderItemsError) return res.status(500).json({ error: orderItemsError.message });

      return res.status(201).json({ order_id: order.id, total });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Méthode ${method} non autorisée` });
  } catch (err) {
    console.error('Erreur /api/orders:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};
