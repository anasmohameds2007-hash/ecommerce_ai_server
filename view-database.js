/**
 * View Database Contents
 * Displays all users stored in MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function viewDatabase() {
  console.log('🔍 Connecting to MongoDB...\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('\n' + '='.repeat(80));
    
    // Get all users
    const users = await User.find({}).lean();
    
    console.log(`\n📊 Total Users Found: ${users.length}\n`);
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('\nNo users found in database.\n');
      return;
    }
    
    // Display each user
    users.forEach((user, index) => {
      console.log(`\n👤 USER #${index + 1}`);
      console.log('-'.repeat(80));
      console.log(`   ID:           ${user._id}`);
      console.log(`   Name:         ${user.name}`);
      console.log(`   Email:        ${user.email}`);
      console.log(`   Role:         ${user.role}`);
      console.log(`   Phone:        ${user.phone || 'Not provided'}`);
      console.log(`   Avatar:       ${user.avatar || 'Default'}`);
      console.log(`   Active:       ${user.isActive ? 'Yes ✓' : 'No ✗'}`);
      console.log(`   Created:      ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   Last Login:   ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
      console.log(`   Wishlist:     ${user.wishlist.length} items`);
      console.log(`   Addresses:    ${user.addresses.length} addresses`);
      
      if (user.addresses.length > 0) {
        console.log('\n   📍 Address List:');
        user.addresses.forEach((addr, i) => {
          console.log(`      ${i + 1}. ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`);
        });
      }
      
      console.log('-'.repeat(80));
    });
    
    console.log('\n✨ Database view complete!\n');
    
    // Show statistics
    console.log('📈 STATISTICS:');
    console.log('='.repeat(80));
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const usersWithLogin = users.filter(u => u.lastLogin).length;
    
    console.log(`   Total Users:        ${users.length}`);
    console.log(`   Active Users:       ${activeUsers}`);
    console.log(`   Inactive Users:     ${inactiveUsers}`);
    console.log(`   Admin Users:        ${adminUsers}`);
    console.log(`   Users Logged In:    ${usersWithLogin}`);
    console.log(`   Never Logged In:    ${users.length - usersWithLogin}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Database connection closed.\n');
  }
}

// Run the viewer
viewDatabase();
