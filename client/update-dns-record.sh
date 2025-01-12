#!/bin/bash

# Ensure required environment variables are set
if [ -z "$SECRET" ] || [ -z "$HOSTNAME" ] || [ -z "$API_URL" ]; then
  echo "Error: SECRET, HOSTNAME, and API_URL environment variables must be set."
  exit 1
fi

# Fetch the public IP address
IP_ADDRESS=$(curl -s $API_URL)

# Save the current timestamp
TIMESTAMP=$(date +%s)

# Calculate the validation hash
VALIDATION_HASH=$(echo -n "${IP_ADDRESS}${HOSTNAME}${TIMESTAMP}${SECRET}" | sha256sum | head -c 64)

# Create the payload
PAYLOAD=$(jq -n \
          --arg ddns_hostname "$HOSTNAME" \
          --argjson timestamp  "$TIMESTAMP" \
          --arg validation_hash "$VALIDATION_HASH" \
          '$ARGS.named'
        )
# Send the POST request
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo ""
