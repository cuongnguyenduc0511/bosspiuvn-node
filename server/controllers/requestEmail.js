const nodemailer = require('nodemailer');
const hbsNodemailer = require('nodemailer-express-handlebars');
const { assign, merge, indexOf } = require('lodash');
const moment = require('moment');
const { REQUEST_STATUS, ERROR_STATUS_TYPES } = require('../shared/constant');
const sendGridTransport = require('nodemailer-sendgrid');

// const nodemailerTransport = nodemailer.createTransport({
//   // host: process.env.MAILGUN_SMTP_HOST,
//   // port: process.env.MAILGUN_SMTP_PORT,
//   // auth: {
//   //   user: process.env.MAILGUN_SMTP_USERNAME,
//   //   pass: process.env.MAILGUN_SMTP_PASSWORD
//   // }
//   host: 'smtp.sendgrid.net',
//   port: 465,
//   auth: {
//     user: 'apikey',
//     pass: process.env.SENDGRID_SMTP_KEY
//   }
// });

const nodemailerTransport = nodemailer.createTransport(sendGridTransport({
  apiKey: process.env.SENDGRID_API_KEY
}));

const nodemailerOptions = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: 'views/email/',
    defaultLayout: 'email_default',
    partialsDir: 'views/email/'
    // partialsDir : 'views/partials/'
  },
  viewPath: 'views/email/',
  extName: '.hbs'
};

nodemailerTransport.use('compile', hbsNodemailer(nodemailerOptions));

module.exports.sendTokenEmail = async (requestItem, updateToken) => {
  try {
    const { song, stepchartInfo: { stepchartType, stepchartLevel }, email } = requestItem;
    const { mode, tokenPayload } = updateToken;
    const title = `BOSS_PIUVN UCS Tracking: ${mode} request token for ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel}`

    const mailOptions = {
      from: `BOSS_PIUVN Official <${process.env.TEST_EMAIL}>`,
      to: email,
      subject: title,
      template: 'token_body',
      context: {
        target: requestItem,
        tokenPayload,
        mode,
        modeLowercase: mode.toLowerCase()
      }
    }

    await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve({
      updateMode: mode.toLowerCase(),
      registeredEmail: email
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

module.exports.sendRegisterEmail = async (addedRequest, req) => {
  try {
    const {
      stepchartInfo: { stepchartLevel, stepchartType },
      song,
      email,
      requestId,
      activationToken: { token: activationToken, exp: expiredAt }
    } = addedRequest;

    const title = `BOSS_PIUVN UCS Tracking: Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has been sent`;

    const mailOptions = {
      from: `BOSS_PIUVN Official <${process.env.TEST_EMAIL}>`,
      to: email,
      subject: title,
      template: 'register_body',
      context: {
        target: addedRequest,
        activationLink: `${req.protocol}://${req.headers.host}/request-activation?id=${requestId}&token=${activationToken}`,
        expiredAt: moment(expiredAt).format('dddd, MMMM Do YYYY, h:mm:ss A Z'),
      }
    }

    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

module.exports.sendStatusEmail = async (requestItem, status) => {
  try {
    const mailOptions = getStatusEmailOptions(requestItem, status);
    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function getStatusEmailOptions(requestItem, status) {
  const {
    stepchartInfo: {stepchartLevel, stepchartType},
    song,
    email
  } = requestItem;
  let mailOptionObj = {};
  let defaultMailOption = {
    from: `BOSS_PIUVN Official <${process.env.TEST_EMAIL}>`,
    to: email,
    context: {
      target: requestItem
    }
  }
  if(indexOf(ERROR_STATUS_TYPES, status) !== -1) {
    const { expiredDate } = requestItem;
    assign(mailOptionObj, {
      subject: `BOSS_PIUVN UCS Tracking: Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has error`,
      template: 'error_request_body',
      context: {
        expiredDate: moment(expiredDate).format('dddd, MMMM Do YYYY, h:mm:ss A Z')
      }
    });
  } else if (status === REQUEST_STATUS.COMPLETED) {
    assign(mailOptionObj, {
      subject: `BOSS_PIUVN UCS Tracking: Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has been completed`,
      template: 'request_completed_body'
    });
  } else {
    assign(mailOptionObj, {
      subject: `BOSS_PIUVN UCS Tracking: Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} - Status Changed`,
      template: 'standard_status_request_body'
    });
  }
  
  return merge(defaultMailOption, mailOptionObj);
}