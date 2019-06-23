// jshint ignore: start
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('file-system');
const { includes } = require('lodash');
var UAParser = require('ua-parser-js');
require('dotenv').config()

//session + flash + cookie parser
var session = require('express-session');
var flash = require('connect-flash');

//bodyParser + methodOveride
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//Connect to MongoDB / Mongoose ODM
var mongoose = require('mongoose');
mongoose.connect(process.env.PROD_DB_CONNECTION_STRING, { useNewUrlParser: true });

//Handlebars sections setup
var express_handlebars_sections = require('express-handlebars-sections');
var hbs = require('hbs');
var engines = require('engines');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');

hbs.registerHelper("section", express_handlebars_sections());
app.engine('handlebars', engines.handlebars);

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {

        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));

    });
    return filelist;
}

var filelist = walkSync(path.join(__dirname, '../views/partials'));
if (filelist.length > 0) {
    filelist.forEach(function (filename) {
        var matches = /^([^.]+).hbs$/.exec(path.basename(filename));
        if (!matches) {
            return;
        }
        var name = matches[1];
        // console.log(name);
        var template = fs.readFileSync(filename, 'utf8');
        hbs.registerPartial(name, template);
    });
}


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Client Browser detection (IE)
app.use(function (req, res, next) {
    var parser = new UAParser();
    const notCompatibleBrowser = ['IEMobile', 'Safari']
    var ua = req.headers['user-agent'];
    var browserName = parser.setUA(ua).getBrowser().name;

    if(includes(notCompatibleBrowser, browserName)) {
        return res.send('Browser is not supported, please install Firefox / Chrome to access');
    }

    next();
})

// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, X-XSRF-TOKEN, Authorization");

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//flash session
app.use(cookieParser('secret'));
var sess = {
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 3600000
    },
    rolling: true
};
app.use(session(sess));
app.use(flash());


//SETUP Method override [PUT & DELETE] Form HTML5
app.use(bodyParser.urlencoded({ extended: true }))

// // Mount csrfProtection before initialize route
// const csrf = require('csurf');
// const csrfProtection = csrf();
// app.use(csrfProtection);

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // // render the error page
    // res.status(err.status || 500);
    // res.render('error');

    // // render the error page
    if (err.status === 404) {
        res.status(err.status).render('pages/not-found', {
            title: 'Page Not Found | 404',
            layout: 'master_layout/layout2',
            root: root,
        });
    } else if (err.status === 403 && err.code === 'EBADCSRFTOKEN') {
        res.status(err.status).send({
            message: 'CSRF Token required'
        });
    } else {
        // render the error page
        res.status(err.status || 500);
        res.render('error');
    }

});

module.exports = app;
