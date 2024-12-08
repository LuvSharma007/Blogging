var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const PORT = process.env.PORT || 3000;
const connectionString = process.env.DB;


const methodOverride = require('method-override');
// const { default: mongoose } = require('mongoose');
app.use(methodOverride('_method'));

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/uploads', express.static(path.join(__dirname,'uploads')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

mongoose.connect(connectionString)
.then(()=>{
    console.log('database connected !');    
}).catch((error)=>{
    console.log(`database is not connected , ${error}`);
})


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

module.exports = app;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
