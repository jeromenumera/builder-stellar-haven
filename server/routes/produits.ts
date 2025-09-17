import { RequestHandler } from 'express';
import { supabase, convertProduitFromDb } from '../services/supabase';

export const getProducts: RequestHandler = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('actif', true)
      .order('nom');

    if (error) throw error;

    const products = data.map(convertProduitFromDb);
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createProduct: RequestHandler = async (req, res) => {
  try {
    const { nom, prix_ttc, tva, image_url, sku } = req.body;

    const { data, error } = await supabase
      .from('produits')
      .insert({
        nom,
        prix_ttc: parseFloat(prix_ttc),
        tva: parseFloat(tva),
        image_url: image_url || null,
        sku: sku || null,
        actif: true,
      })
      .select()
      .single();

    if (error) throw error;

    const product = convertProduitFromDb(data);
    res.json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prix_ttc, tva, image_url, sku } = req.body;

    const { data, error } = await supabase
      .from('produits')
      .update({
        nom,
        prix_ttc: parseFloat(prix_ttc),
        tva: parseFloat(tva),
        image_url: image_url || null,
        sku: sku || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const product = convertProduitFromDb(data);
    res.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting actif to false
    const { error } = await supabase
      .from('produits')
      .update({ actif: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
};
