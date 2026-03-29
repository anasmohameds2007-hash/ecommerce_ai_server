/**
 * Clean Database - Remove All Test Users
 * Deletes users with "test" in email or common test patterns
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function cleanDatabase() {
  console.log('🧹 Clean Database Tool\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find all users first
    const allUsers = await User.find({});
    console.log(`📊 Total users before cleanup: ${allUsers.length}\n`);
    
    // Patterns for test users
    const testPatterns = [
      /test/i,                    // Contains "test"
      /testuser/i,                // Contains "testuser"
      /test2/i,                   // Contains "test2"
      /anastest/i,                // Contains "anastest"
      /1774729601493/i            // Timestamp pattern from test script
    ];
    
    // Find users to delete
    const usersToDelete = allUsers.filter(user => {
      return testPatterns.some(pattern => 
        pattern.test(user.email) || pattern.test(user.name)
      );
    });
    
    if (usersToDelete.length === 0) {
      console.log('✨ No test users found. Database is clean!\n');
      return;
    }
    
    console.log('🗑️  Found test users to delete:\n');
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} <${user.email}>`);
    });
    console.log('\n' + '='.repeat(60));
    console.log(`\n⚠️  This will delete ${usersToDelete.length} user(s)\n`);
    
    // Delete them
    let deletedCount = 0;
    for (const user of usersToDelete) {
      await User.deleteOne({ _id: user._id });
      deletedCount++;
      console.log(`   ✅ Deleted: ${user.email}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Cleanup complete! Deleted ${deletedCount} test user(s)\n`);
    
    // Show remaining users
    const remainingUsers = await User.find({});
    console.log('📋 Remaining users:\n');
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} <${user.email}>`);
    });
    console.log(`\n📊 Total remaining: ${remainingUsers.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed.\n');
  }
}

// Run cleanup
cleanDatabase();

