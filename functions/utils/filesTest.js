const { db, storage } = require('../admin');
const path = require('path');
const os = require('os');
const fs = require('fs');

module.exports = async () => {
  const tempFilePath = path.join(os.tmpdir(), 'input.csv');
  const filePath = 'csvFiles/ppr-202003.csv';

  console.log('tempFilePath: ', tempFilePath);
  const bucket = storage.bucket('gs://house-price-map.appspot.com');
  //await bucket.file(filePath).download({ destination: tempFilePath });

  let mostRecentFile;

  const [files] = await bucket.getFiles({
    delimiter: '/',
    prefix: 'csvFiles/',
  });

  console.log('csvFiles:');
  files.forEach(file => {
    console.log(file.name, file.metadata.timeCreated);
    mostRecentFile = file;
  });
  console.log(mostRecentFile);

  //fs.unlinkSync(tempFilePath);
  return true;
};
