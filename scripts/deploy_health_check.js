#!/usr/bin/env node
'use strict';

// Post-deploy health check for Cloudflare Worker deployments.
// Usage: set HEALTH_URL in CI/CD environment; this script will fetch it and verify status.
// If HEALTH_URL is not provided, the script will skip health checks gracefully.

const HEALTH_URL = process.env.HEALTH_URL;

async function run() {
  if (!HEALTH_URL) {
    console.log('HEALTH_URL not provided; skipping post-deploy health check.');
    process.exit(0);
  }

  try {
    console.log(`Pinging health endpoint: ${HEALTH_URL}`);
    const res = await fetch(HEALTH_URL, { method: 'GET' });
    if (res.ok) {
      console.log(`Health check successful: ${res.status}`);
      process.exit(0);
    } else {
      console.error(`Health check failed: ${res.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Health check error:', err);
    process.exit(1);
  }
}

run();
