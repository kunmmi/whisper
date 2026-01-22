/**
 * Phase 1 Authentication System Test Script
 * Tests all authentication endpoints
 */

const baseUrl = 'http://localhost:3000';

// Helper function to make API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logTest(message) {
  console.log(`\n${colors.yellow}🧪 ${message}${colors.reset}`);
}

// Main test function
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 1 Authentication System - Test Suite');
  console.log('='.repeat(60));

  let token = null;
  let userId = null;
  const testEmail = `test${Date.now()}@example.com`;
  const testUsername = `testuser${Date.now()}`;
  const testPassword = 'password123';

  // Test 1: Register new user
  logTest('Test 1: Register new user');
  const registerResult = await apiCall('POST', '/api/auth/register', {
    email: testEmail,
    username: testUsername,
    password: testPassword,
  });

  if (registerResult.status === 201 && registerResult.data.user) {
    logSuccess('Registration successful');
    console.log(`   User ID: ${registerResult.data.user.id}`);
    console.log(`   Username: ${registerResult.data.user.username}`);
    console.log(`   Email: ${registerResult.data.user.email}`);
    token = registerResult.data.token;
    userId = registerResult.data.user.id;
  } else {
    logError(`Registration failed: ${JSON.stringify(registerResult.data)}`);
    return;
  }

  // Test 2: Try to register with duplicate email
  logTest('Test 2: Try to register with duplicate email');
  const duplicateEmailResult = await apiCall('POST', '/api/auth/register', {
    email: testEmail,
    username: 'anotheruser',
    password: 'password123',
  });

  if (duplicateEmailResult.status === 400) {
    logSuccess('Correctly rejected duplicate email');
  } else {
    logError(`Should have rejected duplicate email. Status: ${duplicateEmailResult.status}`);
  }

  // Test 3: Try to register with duplicate username
  logTest('Test 3: Try to register with duplicate username');
  const duplicateUsernameResult = await apiCall('POST', '/api/auth/register', {
    email: 'another@example.com',
    username: testUsername,
    password: 'password123',
  });

  if (duplicateUsernameResult.status === 400) {
    logSuccess('Correctly rejected duplicate username');
  } else {
    logError(`Should have rejected duplicate username. Status: ${duplicateUsernameResult.status}`);
  }

  // Test 4: Try to register with invalid password (too short)
  logTest('Test 4: Try to register with invalid password (too short)');
  const invalidPasswordResult = await apiCall('POST', '/api/auth/register', {
    email: 'new@example.com',
    username: 'newuser',
    password: '123',
  });

  if (invalidPasswordResult.status === 400) {
    logSuccess('Correctly rejected weak password');
  } else {
    logError(`Should have rejected weak password. Status: ${invalidPasswordResult.status}`);
  }

  // Test 5: Try to register with invalid email format
  logTest('Test 5: Try to register with invalid email format');
  const invalidEmailResult = await apiCall('POST', '/api/auth/register', {
    email: 'notanemail',
    username: 'newuser',
    password: 'password123',
  });

  if (invalidEmailResult.status === 400) {
    logSuccess('Correctly rejected invalid email format');
  } else {
    logError(`Should have rejected invalid email. Status: ${invalidEmailResult.status}`);
  }

  // Test 6: Login with email
  logTest('Test 6: Login with email');
  const loginEmailResult = await apiCall('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });

  if (loginEmailResult.status === 200 && loginEmailResult.data.token) {
    logSuccess('Login with email successful');
    token = loginEmailResult.data.token;
  } else {
    logError(`Login with email failed: ${JSON.stringify(loginEmailResult.data)}`);
  }

  // Test 7: Login with username
  logTest('Test 7: Login with username');
  const loginUsernameResult = await apiCall('POST', '/api/auth/login', {
    username: testUsername,
    password: testPassword,
  });

  if (loginUsernameResult.status === 200 && loginUsernameResult.data.token) {
    logSuccess('Login with username successful');
    token = loginUsernameResult.data.token;
  } else {
    logError(`Login with username failed: ${JSON.stringify(loginUsernameResult.data)}`);
  }

  // Test 8: Login with wrong password
  logTest('Test 8: Login with wrong password');
  const wrongPasswordResult = await apiCall('POST', '/api/auth/login', {
    email: testEmail,
    password: 'wrongpassword',
  });

  if (wrongPasswordResult.status === 401) {
    logSuccess('Correctly rejected wrong password');
  } else {
    logError(`Should have rejected wrong password. Status: ${wrongPasswordResult.status}`);
  }

  // Test 9: Get /api/auth/me with valid token
  logTest('Test 9: Get /api/auth/me with valid token');
  const getMeResult = await apiCall('GET', '/api/auth/me', null, token);

  if (getMeResult.status === 200 && getMeResult.data.user) {
    logSuccess('Protected route accessible with valid token');
    console.log(`   User ID: ${getMeResult.data.user.id}`);
    console.log(`   Username: ${getMeResult.data.user.username}`);
  } else {
    logError(`Get me failed: ${JSON.stringify(getMeResult.data)}`);
  }

  // Test 10: Get /api/auth/me without token
  logTest('Test 10: Get /api/auth/me without token');
  const noTokenResult = await apiCall('GET', '/api/auth/me');

  if (noTokenResult.status === 401) {
    logSuccess('Correctly rejected request without token');
  } else {
    logError(`Should have rejected request without token. Status: ${noTokenResult.status}`);
  }

  // Test 11: Get /api/auth/me with invalid token
  logTest('Test 11: Get /api/auth/me with invalid token');
  const invalidTokenResult = await apiCall('GET', '/api/auth/me', null, 'invalid.token.here');

  if (invalidTokenResult.status === 403) {
    logSuccess('Correctly rejected invalid token');
  } else {
    logError(`Should have rejected invalid token. Status: ${invalidTokenResult.status}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  logInfo('All tests completed!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch(console.error);

