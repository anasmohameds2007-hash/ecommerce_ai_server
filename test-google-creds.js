/**
 * Test Google OAuth Credentials
 */

require('dotenv').config();

console.log('\n🔍 Testing Google OAuth Configuration\n');
console.log('='.repeat(60));

// Check if credentials exist
if (!process.env.GOOGLE_CLIENT_ID) {
  console.log('❌ GOOGLE_CLIENT_ID is missing!');
} else {
  console.log('✅ GOOGLE_CLIENT_ID found');
  console.log(`   Length: ${process.env.GOOGLE_CLIENT_ID.length} chars`);
  console.log(`   Starts with: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.log('❌ GOOGLE_CLIENT_SECRET is missing!');
} else {
  console.log('✅ GOOGLE_CLIENT_SECRET found');
  console.log(`   Length: ${process.env.GOOGLE_CLIENT_SECRET.length} chars`);
  console.log(`   Starts with: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 15)}...`);
}

if (!process.env.GOOGLE_CALLBACK_URL) {
  console.log('❌ GOOGLE_CALLBACK_URL is missing!');
} else {
  console.log('✅ GOOGLE_CALLBACK_URL found');
  console.log(`   URL: ${process.env.GOOGLE_CALLBACK_URL}`);
}

console.log('='.repeat(60));

// Validate format
const clientIdPattern = /^\d{1,}-[a-z0-9]+\.apps\.googleusercontent\.com$/;
const clientSecretPattern = /^GOCSPX-[a-zA-Z0-9_-]+$/;

let valid = true;

if (process.env.GOOGLE_CLIENT_ID && !clientIdPattern.test(process.env.GOOGLE_CLIENT_ID)) {
  console.log('\n❌ GOOGLE_CLIENT_ID format is invalid!');
  console.log('   Expected format: xxxxx-xxxxx.apps.googleusercontent.com');
  valid = false;
} else if (process.env.GOOGLE_CLIENT_ID) {
  console.log('\n✅ GOOGLE_CLIENT_ID format is valid');
}

if (process.env.GOOGLE_CLIENT_SECRET && !clientSecretPattern.test(process.env.GOOGLE_CLIENT_SECRET)) {
  console.log('❌ GOOGLE_CLIENT_SECRET format is invalid!');
  console.log('   Expected format: GOCSPX-xxxxx');
  valid = false;
} else if (process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ GOOGLE_CLIENT_SECRET format is valid');
}

if (valid) {
  console.log('\n✨ All credentials appear to be correctly formatted!\n');
  console.log('📋 Next steps:');
  console.log('   1. Verify Google Cloud Console settings');
  console.log('   2. Ensure OAuth consent screen is published');
  console.log('   3. Check Authorized JavaScript origins');
  console.log('   4. Check Authorized redirect URIs');
  console.log('   5. Try logging in again\n');
} else {
  console.log('\n❌ Please check your .env file and re-copy the credentials\n');
}
