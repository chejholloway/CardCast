#!/usr/bin/env node
/**
 * Cross-platform Node.js utility to test Bluesky getProfiles API.
 * Usage:
 *   node tools/test_getProfiles.js --did did:plc:EXAMPLE_DID --token YOUR_TOKEN --endpoint https://api.bsky.app/xrpc/app.bsky.actor.getProfiles
 * Environment variables can also be used:
 *   BSKY_DID, BSKY_AUTH_TOKEN, BSKY_API_ENDPOINT
 *
 * This script does not log secrets to stdout; replace placeholders locally only.
 */

const http = require('http');
const https = require('https');

// Minimal argument parser for --key value or --flag
function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

(async () => {
  try {
    const args = parseArgs();
    const did = args.did || process.env.BSKY_DID || '';
    const token = args.token || process.env.BSKY_AUTH_TOKEN || '';
    const endpoint =
      args.endpoint ||
      process.env.BSKY_API_ENDPOINT ||
      'https://api.bsky.app/xrpc/app.bsky.actor.getProfiles';

    if (!did) {
      console.error('Error: Missing DID. Provide with --did or BSKY_DID');
      process.exit(2);
    }
    if (!token) {
      console.warn(
        'Warning: No auth token provided. The request may fail if the endpoint requires authentication.'
      );
    }

    const body = JSON.stringify({ actors: [did] });
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = new URL(endpoint);
    const isHttps = url.protocol === 'https:';
    const options = {
      method: 'POST',
      headers,
      hostname: url.hostname,
      path: url.pathname + url.search,
      port: url.port || (isHttps ? 443 : 80),
    };

    const lib = isHttps ? https : http;
    const res = await new Promise((resolve, reject) => {
      const req = lib.request(options, (r) => resolve(r));
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response headers:', JSON.stringify(res.headers));
      try {
        const json = JSON.parse(data);
        console.log('Body (parsed):', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Body (raw):', data);
      }
    });
  } catch (err) {
    console.error(
      'Error executing request:',
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
})();
