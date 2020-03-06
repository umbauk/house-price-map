const functions = require('firebase-functions');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const createError = require('http-errors');
const cors = require('cors');

const indexRouter = require('./routes/index');
// const addGeoHash = require('./utils/addGeoHashs');
const dbBackup = require('./utils/dbBackup');

const app = express();
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;

  // send the error
  res.status(err.status || 500);
  res.send(res.locals.message);
});

exports.app = functions.https.onRequest(app);

exports.dbBackup = functions.pubsub.schedule('every monday 03:10').onRun(dbBackup);

// const runtimeOpts = {
//   timeoutSeconds: 540,
//   memory: '2GB',
// };

// exports.addGeoHash = functions
//   .runWith(runtimeOpts)
//   .pubsub.schedule('every friday 00:05')
//   .onRun(addGeoHash);
