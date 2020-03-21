const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const { resolve, join } = require('path');
const csv = require('jquery-csv');

const PPR_DATE_URL =
  'https://www.propertypriceregister.ie/website/npsra/pprweb.nsf/page/ppr-home-en';
const PPR_DOWNLOAD_URL1 =
  'https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-';
const PPR_DOWNLOAD_URL2 = '-Dublin.csv/$FILE/PPR-';
const PPR_DOWNLOAD_URL3 = '-Dublin.csv';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // PPR website cert is rejected by node. This fixes it, but makes it unsafe
const CSV_DIR = __dirname + '/csvFiles'; // Directory where CSV files are saved

/*
 * Get filename and date it was created of most recent file in ./csvFiles directory
 */
const getMostRecentDownload = async () => {
  let fileList = await fs.readdirSync(resolve(CSV_DIR));

  let mostRecentDate = new Date(2020, 0, 1);
  let mostRecentFile;

  fileList.forEach(file => {
    stats = fs.statSync(resolve(join(CSV_DIR, file)));
    if (stats.ctime > mostRecentDate) {
      mostRecentFile = file;
      mostRecentDate = stats.ctime;
    }
  });
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
  const month =
    pprLastUpdatedObj.month >= 9 ? pprLastUpdatedObj.month + 1 : `0${pprLastUpdatedObj.month + 1}`;

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
  await pprCSV.body.pipe(dest);
  return dest.path;
};

const formatCSV = async (newFilePath, mostRecentFile) => {
  // read in both csvs
  let newData = await fs.readFileSync(newFilePath);
  let oldData = await fs.readFileSync(CSV_DIR + '/' + mostRecentFile);

  console.log(oldData);

  // dedupe to get only new sales
  // format
  // let pprObjects = await csv.toObjects(pprCSV);
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

    if (pprLastUpdatedDate > mostRecentDownload.date) {
      let csvFilePath = await getHousePriceData(pprLastUpdatedObj);
      let formattedCSVFile = formatCSV(csvFilePath, mostRecentDownload.file);
    }
  } catch (err) {
    console.log(err);
  }
  // populate coords
  // convert to JSON (CSVToJson.js)
  // append to db (uploadToFirestore.js edited to append instead of replace)
  // save db last updated date
}

main();
