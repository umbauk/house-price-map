/*
 * Converts a CSV file to JSON
 */

const csvToJSON = require('csvtojson');
const fs = require('fs');
const CSV_FILE_PATH = '../ignored-files/property_price_db.csv'; // input CSV file

csvToJSON({ checkType: true })
  .fromFile(CSV_FILE_PATH)
  .then(jsonObj => {
    // output json file
    fs.writeFile('property_price_db.json', JSON.stringify(jsonObj), err => {
      if (err) throw err;

      console.log('The file has been saved!');
    });
  });
