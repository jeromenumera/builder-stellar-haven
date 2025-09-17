import { RequestHandler } from 'express';
import { supabase, convertEvenementFromDb } from '../services/supabase';

export const getEvents: RequestHandler = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .order('date_debut', { ascending: false });

    if (error) throw error;

    const events = data.map(convertEvenementFromDb);
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createEvent: RequestHandler = async (req, res) => {
  try {
    const { nom, date_debut, date_fin, lieu, statut } = req.body;

    const { data, error } = await supabase
      .from('evenements')
      .insert({
        nom,
        date_debut,
        date_fin,
        lieu,
        statut: statut || 'actif',
      })
      .select()
      .single();

    if (error) throw error;

    const event = convertEvenementFromDb(data);
    res.json(event);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, date_debut, date_fin, lieu, statut } = req.body;

    const { data, error } = await supabase
      .from('evenements')
      .update({
        nom,
        date_debut,
        date_fin,
        lieu,
        statut,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const event = convertEvenementFromDb(data);
    res.json(event);
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('evenements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
};
