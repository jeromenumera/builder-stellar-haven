import { RequestHandler } from "express";
import { supabase } from "../services/supabase";

export const testSupabase: RequestHandler = async (req, res) => {
  try {
    console.log("Testing Supabase connection...");

    // Check environment variables
    const envCheck = {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
      VITE_SUPABASE_ANON_KEY: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    };

    console.log("Environment variables:", envCheck);

    // Test simple query
    const { data: testData, error: testError } = await supabase
      .from("evenements")
      .select("id, nom")
      .limit(1);

    if (testError) {
      console.error("Supabase test query error:", testError);
      return res.status(500).json({
        error: "Supabase connection failed",
        details: testError.message,
        env: envCheck,
      });
    }

    // Test write operation (insert then delete)
    const testPayload = {
      evenement_id: 1,
      mode_paiement: "carte",
      total_ttc: 1.0,
      total_ht: 0.95,
      tva_totale: 0.05,
    };

    console.log("Testing insert with payload:", testPayload);

    const { data: insertData, error: insertError } = await supabase
      .from("ventes")
      .insert(testPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert test error:", insertError);
      return res.status(500).json({
        error: "Supabase insert failed",
        details: insertError.message,
        env: envCheck,
        payload: testPayload,
      });
    }

    // Clean up test data
    if (insertData?.id) {
      await supabase.from("ventes").delete().eq("id", insertData.id);
    }

    res.json({
      success: true,
      message: "Supabase connection and permissions working",
      env: envCheck,
      testQuery: testData,
    });
  } catch (error: any) {
    console.error("Test error:", error);
    res.status(500).json({
      error: "Test failed",
      details: error.message,
      stack: error.stack,
    });
  }
};
