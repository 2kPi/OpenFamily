#!/bin/sh

# Start nginx in background
nginx

# Start Node.js API server
exec node /app/dist/index.js
