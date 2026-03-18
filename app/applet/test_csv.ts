import axios from 'axios';

const urlA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1722593857&single=true&output=csv';
const urlB = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaFKe2m2x6HyEePar5T_yE4xTAzJ5QFs2pveVPM0SJXiKr0QrJoEYiaCAJ4L3-HROBj51_kAwlUXq6/pub?gid=1092502501&single=true&output=csv';

async function test() {
  try {
    const resA = await axios.get(urlA);
    console.log('Data A (first 5 lines):');
    console.log(resA.data.split('\n').slice(0, 5).join('\n'));
    
    const resB = await axios.get(urlB);
    console.log('Data B (first 5 lines):');
    console.log(resB.data.split('\n').slice(0, 5).join('\n'));
  } catch (e) {
    console.error(e);
  }
}

test();
