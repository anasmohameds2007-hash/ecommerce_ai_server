/**
 * Delete User from Database
 * Usage: node delete-user.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteUser(email) {
  console.log('🗑️  Delete User Tool\n');
  console.log('='.repeat(60));
  
  if (!email) {
    console.log('❌ Error: Please provide an email address');
    console.log('\nUsage: node delete-user.js <email>');
    console.log('Example: node delete-user.js test@example.com\n');
    return;
  }
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find the user first
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('\nAvailable users in database:');
      const allUsers = await User.find({}, 'email name');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`);
      });
      return;
    }
    
    // Display user details
    console.log('📋 User Found:');
    console.log('-'.repeat(60));
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   ID:       ${user._id}`);
    console.log(`   Created:  ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
    console.log('-'.repeat(60));
    
    // Ask for confirmation (in real scenario, you'd prompt)
    // For now, we'll just delete
    console.log('\n⚠️  Deleting user...\n');
    
    // Delete the user
    await User.deleteOne({ email: email.toLowerCase() });
    
    console.log('✅ User deleted successfully!\n');
    console.log('='.repeat(60));
    
    // Show remaining users count
    const remainingUsers = await User.countDocuments();
    console.log(`\n📊 Remaining users in database: ${remainingUsers}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed.\n');
  }
}

// Get email from command line argument
const email = process.argv[2];
deleteUser(email);
