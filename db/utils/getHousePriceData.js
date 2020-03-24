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

const PPR_DATE_URL =
  'https://www.propertypriceregister.ie/website/npsra/pprweb.nsf/page/ppr-home-en';
const PPR_DOWNLOAD_URL1 =
  'https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-';
const PPR_DOWNLOAD_URL2 = '-Dublin.csv/$FILE/PPR-';
const PPR_DOWNLOAD_URL3 = '-Dublin.csv';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // PPR website cert is rejected by node. This fixes it, but makes it unsafe
const CSV_DIR = __dirname + '/csvFiles'; // Directory where CSV files are saved
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
  let fileList = await fs.promises.readdir(resolve(CSV_DIR));

  let mostRecentDate = new Date(2020, 0, 1);
  let mostRecentFile;

  await Promise.all(
    fileList.map(async file => {
      let stats = await fs.promises.stat(resolve(join(CSV_DIR, file)));
      if (stats.ctime > mostRecentDate) {
        mostRecentFile = file;
        mostRecentDate = stats.ctime;
      }
      return stats;
    }),
  );

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

const readCSV = async filePath => {
  let data = await readFile(filePath);
  return neatCsv(data);
};

const replaceFieldNames = houseSalesArray => {
  console.log('houseSalesArray: ', houseSalesArray);
  let returnArray = houseSalesArray.map(houseObj => {
    for (const field in FIELD_NAME_MAPPING) {
      delete Object.assign(houseObj, { [FIELD_NAME_MAPPING[field]]: houseObj[field] })[field];
    }
    return houseObj;
  });
  return returnArray;
};

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

    console.log(dataObjWithNewFieldNames);
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
                reject(err);
              } else {
                if (response.json.status !== 'OK') {
                  console.log(`ERROR: ${response.json.status} - ${houseSalesArray[i].address}`);
                  if (response.json.status === 'ZERO_RESULTS') {
                    console.log(`${i + 1}: ${houseSalesArray[i].address}: ${response.json.status}`);
                    houseSalesArray[i].lat = 0;
                    houseSalesArray[i].lng = 0;
                  }
                  reject(response.json.status);
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

// https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-2020-03-Dublin.csv/$FILE/PPR-2020-03-Dublin.csv

async function main() {
  try {
    let mostRecentDownload = await getMostRecentDownload();
    let pprLastUpdatedObj = await getPprLastUpdated();
    let pprLastUpdatedDate = new Date(
      pprLastUpdatedObj.year,
      pprLastUpdatedObj.month,
      pprLastUpdatedObj.day,
    );

    // if (pprLastUpdatedDate > mostRecentDownload.date) {
    let csvFilePath = await getHousePriceData(pprLastUpdatedObj);
    let formattedCSVObj = await formatCSV(csvFilePath, mostRecentDownload.file);
    let formattedObjwCoords = await populateCoords(formattedCSVObj);
    let finalJSON = addGeoHash(formattedObjwCoords);

    // convert JSON to CSV
    let finalCSV = parse(finalJSON);

    // save CSV file
    let fileName = `${pprLastUpdatedObj.year}${pprLastUpdatedObj.month}${pprLastUpdatedObj.day}.csv`;
    writeFile(join(CSV_DIR, '../uploads', fileName), finalCSV, 'utf8');

    // append to db (uploadToFirestore.js edited to append instead of replace)
    // save db last updated date in Firestore to display in Front-end

    // }
  } catch (err) {
    console.log(err);
  }
}

main();
