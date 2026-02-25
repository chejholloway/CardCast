#!/usr/bin/env node
'use strict';
// One-click end-to-end deploy: guard -> build -> deploy -> health-check (auto-derive HEALTH_URL)
const { spawnSync } = require('child_process');

function run(cmd, args, opts) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    ...opts,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
  return res;
}

// Step 1: guard
console.log('[deploy_all] Guarding deploy path...');
run('node', ['scripts/deploy_guard.js']);

// Step 2: build
console.log('[deploy_all] Building Cloudflare worker...');
run('npm', ['run', 'build:cf']);

// Step 3: deploy
console.log('[deploy_all] Deploying to Cloudflare...');
let deployOut = spawnSync('npm', ['run', 'deploy:cf'], {
  encoding: 'utf8',
  shell: true,
  stdio: 'pipe',
});
console.log(deployOut.stdout || '');
console.error(deployOut.stderr || '');
if (deployOut.error) process.exit(1);

// Step 4: health check (derive URL if possible)
const stdout = deployOut.stdout || '';
const stderr = deployOut.stderr || '';
const combined = stdout + stderr;

// Look for actual worker URL, not telemetry/docs URLs
const urlMatch = combined.match(/https:\/\/[a-z0-9-]+\.workers\.dev[^ \n]*/);
let healthUrl = null;
if (urlMatch) {
  healthUrl = urlMatch[0].replace(/\/$/, '') + '/health';
  console.log('[deploy_all] Derived health URL:', healthUrl);
} else if (process.env.HEALTH_URL) {
  healthUrl = process.env.HEALTH_URL;
  console.log('[deploy_all] Using provided HEALTH_URL:', healthUrl);
}

if (healthUrl) {
  const env = Object.assign({}, process.env, { HEALTH_URL: healthUrl });
  console.log('[deploy_all] Running post-deploy health check...');
  const health = spawnSync('node', ['scripts/deploy_health_check.js'], {
    env,
    stdio: 'inherit',
  });
  if (health.status !== 0) process.exit(health.status ?? 1);
} else {
  console.log(
    '[deploy_all] No HEALTH_URL available; skipping health check. Set HEALTH_URL or ensure wrangler output contains a URL.'
  );
}
