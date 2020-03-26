/*
 * Checks propertypriceregister.ie for date of last price register update. If has new data, downloads the latest CSV,
 * identifies new sales since last download, formats the data and uploads to Firestore
 */

if (!process.env.GOOGLE_API_KEY) require('dotenv').config({ path: '../../server/.env' });

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const readFile = require('util').promisify(fs.readFile); // wraps fs.readFile in a Promise
const writeFile = require('util').promisify(fs.writeFile); // wraps fs.readFile in a Promise
const { resolve, join } = require('path');
const neatCsv = require('neat-csv');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
});
const geoHash = require('ngeohash');
const { parse } = require('json2csv');
const { db, storage } = require('../admin');

module.exports = async () => {
  const COLLECTION_KEY = 'house-sales'; // name of the firestore collection
  const PPR_DATE_URL =
    'https://www.propertypriceregister.ie/website/npsra/pprweb.nsf/page/ppr-home-en';
  const PPR_DOWNLOAD_URL1 =
    'https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-';
  const PPR_DOWNLOAD_URL2 = '-Dublin.csv/$FILE/PPR-';
  const PPR_DOWNLOAD_URL3 = '-Dublin.csv';
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // PPR website cert is rejected by node. This fixes it, but makes it unsafe
  const CSV_DIR = 'csvFiles/'; // Directory where CSV files are saved
  const bucket = storage.bucket('gs://house-price-map.appspot.com');

  const FIELD_NAME_MAPPING = {
    // maps field names from PPR CSV download to field names in Firestore
    'Date of Sale (dd/mm/yyyy)': 'date_of_sale',
    Address: 'address',
    County: 'county',
    'Description of Property': 'description_of_property',
    'Postal Code': 'postal_code',
    'Price (�)': 'price',
    'Not Full Market Price': 'not_full_market_price',
    'VAT Exclusive': 'vat_exclusive',
    'Property Size Description': 'property_size_description',
  };

  /*
   * Get filename and date it was created of most recent file in ./csvFiles directory
   */
  const getMostRecentDownload = async () => {
    let mostRecentDate = new Date(2020, 0, 1);
    let mostRecentFile;

    // delimiter limits files to csvFiles directory, ignoring child directories
    const [fileList] = await bucket.getFiles({
      delimiter: '/',
      prefix: 'csvFiles/',
    });

    fileList.forEach(file => {
      const fileCreatedDate = new Date(file.metadata.timeCreated);
      if (fileCreatedDate > mostRecentDate) {
        mostRecentFile = file;
        mostRecentDate = fileCreatedDate;
      }
    }),
      console.log('mostRecentFile: ', mostRecentFile);
    return { file: mostRecentFile, date: mostRecentDate };
  };

  /*
   * Scrape PPR website for date data last updated
   */
  const getPprLastUpdated = async () => {
    try {
      const res = await fetch(PPR_DATE_URL);
      const html = await res.text();
      const $ = cheerio.load(html);

      // last udpated date is included in first h4 of the div with id of maincontent
      let h4Text = $('#maincontent')
        .find('h4')
        .text();

      if (h4Text.includes('REGISTER LAST UPDATED')) {
        // Date in format dd/mm/yyyy
        let regEx = / - (\d+)\/(\d+)\/(\d{4}) /;
        let lastUpdateDate = regEx.exec(h4Text);

        // if we are in the first week of a new month, set month to previous month
        // to download last month's data, which may have updated since last download
        if (lastUpdateDate[1] <= 7) lastUpdateDate[2] = lastUpdateDate[2] - 1;

        return {
          year: parseInt(lastUpdateDate[3]),
          month: lastUpdateDate[2] - 1,
          day: parseInt(lastUpdateDate[1]),
        };
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /*
   * Download latest CSV from PPR website and save locally
   */
  const getHousePriceData = async pprLastUpdatedObj => {
    // https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-2020-01-Dublin.csv/$FILE/PPR-2020-01-Dublin.csv
    // Account for zero-based months in date object and ensure it's a 2 digit string
    try {
      const month =
        pprLastUpdatedObj.month >= 9
          ? pprLastUpdatedObj.month + 1
          : `0${pprLastUpdatedObj.month + 1}`;

      const downloadString =
        PPR_DOWNLOAD_URL1 +
        pprLastUpdatedObj.year +
        '-' +
        month +
        PPR_DOWNLOAD_URL2 +
        pprLastUpdatedObj.year +
        '-' +
        month +
        PPR_DOWNLOAD_URL3;

      const pprCSV = await fetch(downloadString);
      const dest = fs.createWriteStream(
        CSV_DIR + '/ppr-' + pprLastUpdatedObj.year + month + pprLastUpdatedObj.day + '.csv',
      );

      await new Promise((resolve, reject) => {
        pprCSV.body.pipe(dest);
        pprCSV.body.on('error', err => {
          reject(err);
        });
        dest.on('finish', () => {
          resolve();
        });
      });

      return dest.path;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /*
   * Read CSV from given file path and use neatCsv to convert to convert to JSON
   */
  const readCSV = async filePath => {
    let data = await readFile(filePath);
    return neatCsv(data);
  };

  /*
   * Replace field names in CSV download with field names used in Firestore
   */
  const replaceFieldNames = houseSalesArray => {
    let returnArray = houseSalesArray.map(houseObj => {
      for (const field in FIELD_NAME_MAPPING) {
        delete Object.assign(houseObj, { [FIELD_NAME_MAPPING[field]]: houseObj[field] })[field];
      }
      return houseObj;
    });
    return returnArray;
  };

  /*
   * Get new house sales since last download and format CSV data in required format for Firestore
   */
  const formatCSV = async (newFilePath, mostRecentFile) => {
    try {
      let newDataObjs = await readCSV(newFilePath);
      let oldDataObjs = await readCSV(join(CSV_DIR, mostRecentFile));

      // Remove all house sales in both files to get set of unique (new) house sales
      let dataObjNewVals = newDataObjs.filter(newHouse => {
        return (
          oldDataObjs.findIndex(
            existingHouse =>
              existingHouse.Address === newHouse.Address &&
              existingHouse['Date of Sale (dd/mm/yyyy)'] === newHouse['Date of Sale (dd/mm/yyyy)'],
          ) === -1
        );
      });

      // replace field names
      let dataObjWithNewFieldNames = replaceFieldNames(dataObjNewVals);

      // format price correctly and convert date from Euro style to US style
      let dateRegEx = /(\d+)\/(\d+)\/(\d{4})/; // gets day, month and year into separate elements
      dataObjWithNewFieldNames.forEach(house => {
        house.price = parseInt(house.price.replace(/[�,]/g, ''));
        let uSDate = dateRegEx.exec(house.date_of_sale);
        house.date_of_sale = `${uSDate[2]}/${uSDate[1]}/${uSDate[3]}`;
      });

      return dataObjWithNewFieldNames;
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * Lookup address strings in Google Maps geocode API to get lat and lng coordinates
   */
  const populateCoords = async houseSalesArray => {
    try {
      return await Promise.all(
        houseSalesArray.map((house, i) => {
          // Request coordinates for addresses from Google Maps
          return new Promise((resolve, reject) => {
            googleMapsClient.geocode(
              {
                address: houseSalesArray[i].address,
              },
              (err, response) => {
                if (err) {
                  console.log(err);
                  resolve();
                } else {
                  if (response.json.status !== 'OK') {
                    console.log(`ERROR: ${response.json.status} - ${houseSalesArray[i].address}`);
                    if (response.json.status === 'ZERO_RESULTS') {
                      console.log(
                        `${i + 1}: ${houseSalesArray[i].address}: ${response.json.status}`,
                      );
                      houseSalesArray[i].lat = 0;
                      houseSalesArray[i].lng = 0;
                    }
                    resolve();
                  } else {
                    console.log(
                      `${i + 1}: ${houseSalesArray[i].address}: ${
                        response.json.results[0].geometry.location.lat
                      }, ${response.json.results[0].geometry.location.lng}`,
                    );
                    houseSalesArray[i].lat = response.json.results[0].geometry.location.lat;
                    houseSalesArray[i].lng = response.json.results[0].geometry.location.lng;
                    resolve();
                  }
                }
              },
            );
          });
        }),
      ).then(() => {
        return houseSalesArray;
      });
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Add geo hash from lat/lng coords as Firestore uses geo hash to pull relevant records
   */
  const addGeoHash = houseArrayWithCoords => {
    return houseArrayWithCoords.map(house => {
      if (house.lat !== 0) {
        let hash = geoHash.encode(house.lat, house.lng);
        house.geoHash = hash;
      }
      return house;
    });
  };

  /*
   * Uploads a JSON file to Firestore, creating a new document for each object. Buffered for large files.
   */
  const uploadToFirestore = jsonDataArray => {
    // set Firestore credentials and settings
    const settings = { timestampsInSnapshots: true };
    db.settings(settings);

    let batch = [];
    let counter = 0;
    let batchNum = 0;
    batch[0] = db.batch();

    console.log('Starting upload...');

    /*
     * Adds object to a batch of Firestore writes. When there are 450 objects in the batch (max is 500),
     * commit batch
     */
    return new Promise((resolve, reject) => {
      jsonDataArray.forEach(obj => {
        counter++;

        batch[batchNum].set(db.collection(COLLECTION_KEY).doc(), obj);

        if (counter > 450) {
          counter = 0;
          batch[batchNum]
            .commit()
            .then(() => {
              console.log('>>>> Batch', batchNum, 'written successfully');
            })
            .catch(err => {
              console.log('XXXXXXXXXXXX Error with batch write:', err);
            });
          batchNum++;
          batch[batchNum] = db.batch();
        }
      });

      batch[batchNum]
        .commit()
        .then(async () => {
          console.log('>>>> Batch', batchNum, 'written successfully');
          let lastUpdatedSnap = await db.collection('last-updated').get();

          // set database last updated date for display in front-end
          lastUpdatedSnap.forEach(async lastUpdated => {
            await lastUpdated.ref.update({ date: new Date() }).catch(error => {
              console.log('Error setting last update date: ', error);
            });
          });

          resolve(true);
        })
        .catch(err => {
          console.log('XXXXXXXXXXXX Error with batch write:', err);
          reject(err);
        });
    });
  };

  async function main() {
    try {
      let mostRecentDownload = await getMostRecentDownload();
      let pprLastUpdatedObj = await getPprLastUpdated();
      let pprLastUpdatedDate = new Date(
        pprLastUpdatedObj.year,
        pprLastUpdatedObj.month,
        pprLastUpdatedObj.day,
      );

      if (pprLastUpdatedDate > mostRecentDownload.date) {
        let csvFilePath = await getHousePriceData(pprLastUpdatedObj);
        let formattedCSVObj = await formatCSV(csvFilePath, mostRecentDownload.file);

        console.log('CSV Formatted...');
        let formattedObjwCoords = await populateCoords(formattedCSVObj);
        console.log('Coords populated...');
        formattedCSVObj = [];
        let finalJSON = addGeoHash(formattedObjwCoords);
        console.log('geoHashes added');
        formattedObjwCoords = [];

        // convert JSON to CSV
        let finalCSV = parse(finalJSON);

        // save CSV file
        let fileName = `${pprLastUpdatedObj.year}${pprLastUpdatedObj.month + 1}${
          pprLastUpdatedObj.day
        }.csv`;
        writeFile(join(CSV_DIR, '../uploads', fileName), finalCSV, 'utf8');
        finalCSV = '';

        // append to firestore
        await uploadToFirestore(finalJSON);
        console.log('Complete');
      }
    } catch (err) {
      console.log(err);
    }
  }

  //main();
  return await getPprLastUpdated();
};
