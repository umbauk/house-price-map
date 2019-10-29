//require('dotenv').config({ path: __dirname + '/.env' });
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

let mongoDB = process.env.MONGO_DB_URL;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

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
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // send the error
  res.status(err.status || 500);
  res.send(res.locals.message);
});

app.listen(3001, () => console.log('Listening on port 3001!'));

module.exports = app;
