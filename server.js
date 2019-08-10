const express    = require('express');
const morgan     = require('morgan');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
mongoose.plugin(require('./lib/globalToJSON'));
mongoose.Promise = require('bluebird').config({
  // Enables all warnings except forgotten return statements.
  warnings: {
    wForgottenReturn: false // The corresponding environmental variable key is BLUEBIRD_W_FORGOTTEN_RETURN.
  }
  // Enable warnings
  // warnings: true,
  // // Enable long stack traces
  // longStackTraces: true,
  // // Enable cancellation
  // cancellation: true,
  // // Enable monitoring
  // monitoring: true
});
const { port, env, dbURI, mongoOptions } = require('./config/environment');
const routes               = require('./config/routes');
const customResponses      = require('./lib/customResponses');
const errorHandler         = require('./lib/errorHandler');

const app = express();

mongoose.connect(dbURI, mongoOptions);

mongoose.connection.once('open', () => {
  mongoose.connection
    // .on('connected', () => console.log('Mongoose default connection is open to [%s]', dbURI))
    .on('error', (err) => console.log(error('Mongoose default connection has occured ' + err + ' error')))
    .on('reconnected', () => console.info('MongoDB event reconnected'))
    .on('disconnected', () => console.log('Mongoose default connection is disconnected '));

  process.on('SIGINT', () => mongoose.connection.close(() => {
    console.log('Mongoose default connection is disconnected due to application termination ');
    process.exit(0);
  }));
});

// mongoose
//   .connect(dbURI, options)
//   .then((err) => {
//     if (err) console.log('Unable to connect to the server. Please start the server. Error:', err);
//     else console.log('Connected to Server successfully!');
//   })
//   .catch((err) => { // we will not be here...
//     console.log('App starting error:', err.stack);
//     process.exit(1);
//   });

// mongoose.connect(dbURI, (err) => {
//   if (err) console.log('Unable to connect to the server. Please start the server. Error:', err);
//   else console.log('Connected to Server successfully!');
// });

if(env !== 'test') app.use(morgan('dev'));

app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json({ limit: '5mb' }));

app.use(customResponses);

app.use('/api', routes);

app.get('/*', (req, res) => res.sendFile(`${__dirname}/public/index.html`));

app.use(errorHandler);

app.listen(port, () => console.log(`Express is listening on port ${port}`));
