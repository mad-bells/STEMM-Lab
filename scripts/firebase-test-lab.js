#!/usr/bin/env node
/**
 * firebase-test-lab.js
 * Uploads the preview APK to Firebase Test Lab and runs a Robo test.
 *
 * Prerequisites:
 *   1. gcloud CLI installed and authenticated  (gcloud auth login)
 *   2. Firebase project set                    (gcloud config set project stemm-lab-5c5fa)
 *   3. APK built via: npm run build:preview    (produces app-preview.apk)
 *
 * Usage:
 *   node scripts/firebase-test-lab.js [path/to/app.apk]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ID = 'stemm-lab-5c5fa';
const RESULTS_BUCKET = `${PROJECT_ID}-test-results`;

// APK path — defaults to the EAS output location or first arg
const apkPath = process.argv[2] || path.join(__dirname, '..', 'app-preview.apk');

if (!fs.existsSync(apkPath)) {
  console.error(`\n❌  APK not found at: ${apkPath}`);
  console.error('   Build one first with:  npm run build:preview');
  console.error('   Then download it from EAS and pass the path:');
  console.error('   node scripts/firebase-test-lab.js path/to/app.apk\n');
  process.exit(1);
}

console.log(`\n🔥  Firebase Test Lab — Robo Test`);
console.log(`    Project : ${PROJECT_ID}`);
console.log(`    APK     : ${apkPath}\n`);

// Run Robo test on two device/API combinations defined in firebase.json
// Results bucket is auto-created by Firebase Test Lab (no billing needed for default bucket)
const cmd = [
  'gcloud firebase test android run',
  `--project=${PROJECT_ID}`,
  `--app=${apkPath}`,
  '--type=robo',
  '--robo-directives=text:teamName=TestTeam,text:memberInput=Alice',
  '--timeout=90s',
  '--device model=redfin,version=30,locale=en,orientation=portrait',
  '--device model=bluejay,version=32,locale=en,orientation=portrait',
  '--no-performance-metrics',
].join(' \\\n  ');

console.log('Running:\n', cmd, '\n');

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('\n✅  Robo test finished. View results at:');
  console.log(`    https://console.firebase.google.com/project/${PROJECT_ID}/testlab/histories\n`);
} catch (err) {
  console.error('\n❌  Test run failed. Check the output above for details.');
  console.error('    Common causes:');
  console.error('    • Not authenticated: run  gcloud auth login');
  console.error('    • Wrong project:     run  gcloud config set project stemm-lab-5c5fa');
  console.error('    • API not enabled:   https://console.developers.google.com/apis/api/testing.googleapis.com\n');
  process.exit(1);
}
