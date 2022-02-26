const createError = require('http-errors');
const express = require('express');

const port = 5000;
const path = require('path');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');

const app = express();

const config = require('./config/mongodb');
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('mongodb connected'))
  .catch(err => console.log(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/books', booksRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log(`ability-backend is listening on port ${port}`);
});

module.exports = app;
