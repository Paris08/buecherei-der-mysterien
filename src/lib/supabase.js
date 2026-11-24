import { createClient } from '@supabase/supabase-js'

// Öffentliche Schlüssel (dürfen im Frontend stehen – Schreibrechte regelt die Datenbank per RLS).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://tzwrulabmotyepyilzwa.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_nZnzqBzbXxm4J3cGsUkrew_ajoHkRun'

export const supabase = createClient(url, key)
export const BILDER_BUCKET = 'akten-bilder'
