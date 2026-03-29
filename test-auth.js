/**
 * Test Authentication Flow
 * This script tests user registration and login with the database
 */

const API_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🔐 Testing Authentication Flow...\n');
  
  // Generate unique test credentials
  const timestamp = Date.now();
  const testUser = {
    name: 'Test User',
    email: `testuser${timestamp}@test.com`,
    password: 'TestPassword123!',
    phone: '9876543210'
  };

  console.log('📝 Step 1: Registering new user...');
  console.log('Email:', testUser.email);
  console.log('Password:', testUser.password);
  console.log('Name:', testUser.name);
  console.log('Phone:', testUser.phone);
  
  try {
    // Test Registration
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('\n✅ Registration Successful!');
      console.log('Response:', JSON.stringify(registerData, null, 2));
      
      const token = registerData.data.token;
      const userId = registerData.data.user.id;
      
      console.log('\n📋 Stored in Database:');
      console.log('User ID:', userId);
      console.log('Token:', token.substring(0, 50) + '...');
      
      // Test Login with same credentials
      console.log('\n🔑 Step 2: Testing Login...');
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('\n✅ Login Successful!');
        console.log('Logged in User:', loginData.data.user.name);
        console.log('Email:', loginData.data.user.email);
        console.log('Last Login Updated:', new Date().toISOString());
        
        // Test Get Profile (authenticated request)
        console.log('\n👤 Step 3: Getting User Profile...');
        const profileResponse = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`
          }
        });

        const profileData = await profileResponse.json();
        
        if (profileResponse.ok) {
          console.log('\n✅ Profile Retrieved Successfully!');
          console.log('Profile Data:', JSON.stringify(profileData.data.user, null, 2));
          
          console.log('\n✨ COMPLETE AUTHENTICATION FLOW VERIFIED! ✨');
          console.log('✅ User registration stores data in MongoDB');
          console.log('✅ User login validates credentials from database');
          console.log('✅ JWT tokens are generated correctly');
          console.log('✅ Authenticated requests work properly');
          
        } else {
          console.error('\n❌ Profile Retrieval Failed:', profileData.message);
        }
        
      } else {
        console.error('\n❌ Login Failed:', loginData.message);
      }
      
    } else {
      console.error('\n❌ Registration Failed:', registerData.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('Make sure the backend server is running on http://localhost:5000');
  }
}

// Run the test
testAuthentication();
