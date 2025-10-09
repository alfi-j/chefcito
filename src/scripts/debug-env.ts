import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('MONGODB_DB:', process.env.MONGODB_DB);

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const url = new URL(uri);
  const password = url.password;
  
  console.log('\nParsed connection details:');
  console.log('Username:', url.username);
  console.log('Password:', password);
  console.log('Host:', url.host);
  console.log('Database:', url.pathname.substring(1));
  
  // Check for special characters that might need encoding
  const specialChars = /[:@/ ?#\[\]]/;
  if (specialChars.test(password)) {
    console.log('\nWARNING: Password contains special characters that may need URL encoding:');
    console.log('  : (colon) should be %3A');
    console.log('  @ (at) should be %40');
    console.log('  / (slash) should be %2F');
    console.log('  ? (question mark) should be %3F');
    console.log('  # (hash) should be %23');
    console.log('  [ (left bracket) should be %5B');
    console.log('  ] (right bracket) should be %5D');
  }
}