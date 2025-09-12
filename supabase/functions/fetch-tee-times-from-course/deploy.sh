#!/bin/bash

# Navigate to the supabase folder (two levels up from current directory)
cd "$(dirname "$0")/../../"

# Run the supabase deployment command
supabase functions deploy fetch-tee-times-from-course --no-verify-jwt
