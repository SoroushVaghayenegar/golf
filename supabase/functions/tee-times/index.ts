// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { getTeeTimes } from "./utils.ts"

Deno.serve(async (req)=>{
  // 🔐 Hardcoded origin — browser needs exact match
  const allowedOrigin = "*";
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": allowedOrigin,
        "access-control-allow-methods": "POST, GET, OPTIONS",
        "access-control-allow-headers": "authorization, content-type",
        "access-control-max-age": "86400"
      }
    });
  }
  if (req.method === "GET") {
    const url = new URL(req.url);
    
    // get query params
    const datesParam = url.searchParams.get('dates')
    const startTime = url.searchParams.get('startTime')
    const endTime = url.searchParams.get('endTime')
    const numOfPlayers = url.searchParams.get('numOfPlayers')
    const holes = url.searchParams.get('holes')
    const courseIdsParam = url.searchParams.get('courseIds')
    const region = url.searchParams.get('region')

    if (!datesParam) {
      return new Response("Dates are required", {
        status: 400,
        headers: {
          "access-control-allow-origin": allowedOrigin
        }
      })
    }
    if (!region) {
      return new Response("Region is required", {
        status: 400,
        headers: {
          "access-control-allow-origin": allowedOrigin
        }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse dates and courseIds from comma-separated strings
    const dates = datesParam.split(',').map(date => date.trim())
    const courseIds = courseIdsParam ? courseIdsParam.split(',').map(id => parseInt(id.trim())) : []

    // Get tee times with forecast data
    const { data, error } = await getTeeTimes(supabase, dates, startTime, endTime, numOfPlayers, holes, courseIds, region)

    const headers = {
      "access-control-allow-origin": allowedOrigin,
      "content-type": "application/json"
    };
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers
      });
    }
    return new Response(JSON.stringify(data), {
      status: 201,
      headers
    });
  }
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      "access-control-allow-origin": allowedOrigin
    }
  });
});