require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testStream() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContentStream('Say hello and welcome to CampusWise AI in 15 words.');
  let full = '';
  for await (const chunk of result.stream) {
    full += chunk.text();
  }
  console.log('STREAM RESULT:', full);
}

testStream();
