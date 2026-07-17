import axios from 'axios';

async function testApi() {
  try {
    console.log('Testing GET http://localhost:3000/api/archive/jobs ...');
    const res = await axios.get('http://localhost:3000/api/archive/jobs');
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
}

testApi();
