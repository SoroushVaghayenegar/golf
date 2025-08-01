// test-local.js
require('dotenv').config();
const { handler } = require('./index.js');

async function testLocal() {
  console.log('Testing Lambda function locally...');
  
  // Mock event object (you can modify this as needed)
  const mockEvent = {
    // Add any event properties your function might use
  };

  try {
    const result = await handler(mockEvent);
    console.log('Success!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testLocal();