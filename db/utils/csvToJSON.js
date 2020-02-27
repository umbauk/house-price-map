/*
 * Converts a CSV file to JSON
 */

const csvToJSON = require('csvtojson');
const fs = require('fs');
const CSV_FILE_PATH = '../ignored-files/property_price_db.csv'; // input CSV file
const JSON_FILENAME = 'property_price_db.json'; // output json file

csvToJSON({ checkType: true })
  .fromFile(CSV_FILE_PATH)
  .then(jsonObj => {
    fs.writeFile(JSON_FILENAME, JSON.stringify(jsonObj), err => {
      if (err) throw err;

      console.log('The file has been saved!');
    });
  });
