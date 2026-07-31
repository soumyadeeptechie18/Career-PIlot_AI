import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://ayysxubywemzjrvjulfh.supabase.co";

// PLACEHOLDER: Replace this string with your Supabase project's public anon key.
// You can find this key in your Supabase Dashboard under: Project Settings -> API -> anon public
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
