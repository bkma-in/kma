import axios from 'axios';

async function test() {
  try {
    const key = 'issues/volume_19/issue_1/2025 June Issue.pdf';
    console.log(`Testing GET with key query...`);
    const res = await axios.get(`http://localhost:3000/api/articles/staged/pdf?key=${encodeURIComponent(key)}`);
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
}

test();
