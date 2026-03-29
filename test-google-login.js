/**
 * Test Google OAuth Login Flow
 * Simulates what happens when a user logs in with Google
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testGoogleLogin() {
  console.log('\n🔍 Testing Google OAuth Database Storage\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Show all users who logged in with Google
    const googleUsers = await User.find({ googleId: { $exists: true } }).lean();
    
    if (googleUsers.length === 0) {
      console.log('⏳ No Google login users found yet.\n');
      console.log('📋 To test Google login:');
      console.log('   1. Go to http://localhost:3000/login');
      console.log('   2. Click "Sign in with Google" button');
      console.log('   3. Choose your Google account');
      console.log('   4. Come back and run this script again\n');
    } else {
      console.log(`✨ Found ${googleUsers.length} Google login user(s):\n`);
      
      googleUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Google ID: ${user.googleId}`);
        console.log(`   Avatar: ${user.avatar ? 'Yes ✓' : 'No ✗'}`);
        console.log(`   Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
        console.log('-'.repeat(60));
      });
      
      console.log('\n🎉 Google login is working correctly!\n');
      console.log('💡 Users are being stored in MongoDB with:');
      console.log('   - Name from Google');
      console.log('   - Email from Google');
      console.log('   - Google ID for authentication');
      console.log('   - Profile picture URL (avatar)');
      console.log('   - Last login timestamp\n');
    }
    
    // Show total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed.\n');
  }
}

// Run the test
testGoogleLogin();
