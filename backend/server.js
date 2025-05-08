require('rootpath')();
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
app.use('/api-docs', require('./_helpers/swagger'));
const errorHandler = require('./_middleware/error_handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Define environment variables
const isProduction = process.env.NODE_ENV === 'production';
const port = isProduction ? (process.env.PORT || 80) : 4000;

// Define allowed origins
const allowedOrigins = [
    'https://user-management-angular-eight.vercel.app',
    'https://user-management-angular.vercel.app',
    'https://user-management-angular.onrender.com',
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200'
];

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// api routes
app.use('/accounts', require('./accounts/accounts.controller'));

// swagger docs route
app.use('/api-docs', require('./_helpers/swagger'));

// global error handler
app.use(errorHandler);

// start server
app.listen(port, () => {
    console.log('Server listening on port ' + port);
    console.log('API Documentation available at /api-docs');
});