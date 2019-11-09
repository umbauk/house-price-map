if (!process.env.MONGO_DB_URI) require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const compression = require('compression');
const path = require('path');
const createError = require('http-errors');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();
app.use(helmet());

let mongoDB = process.env.MONGO_DB_URI;
mongoose
  .connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
  })
  .catch(error => console.error('Cannot connect to MongoDB.', error));
let db = mongoose.connection;
db.on('connected', function() {
  console.log(connected('Mongoose default connection is open to ', dbURL));
});

db.on('error', function(err) {
  console.log(error('Mongoose default connection has occured ' + err + ' error'));
});

db.on('disconnected', function() {
  console.log(disconnected('Mongoose default connection is disconnected'));
});

process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    console.log('Mongoose default connection is disconnected due to application termination');
    process.exit(0);
  });
});

//app.use(logger('dev'));
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

app.listen(3001, () => console.log('Listening on port 3001!'));

module.exports = app;
