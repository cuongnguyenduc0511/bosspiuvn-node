const requestController = require('../controllers/requestController');
const { TITLE_FORMAT } = require('../shared/constant');
const express = require('express');
const { activateRequestMiddleware, registerRequestMiddleware,
  updateRequestMiddleware, deleteRequestMiddleware, resendActivationMiddleware, requestTokenMiddleware } = require('../middleware/middleware');
const csrf = require('csurf');
const csrfProtection = csrf();

var router = express.Router();

router.get('/', ({ res }) => {
  res.redirect('/home');
});

// router.get('/home-test', (req, res, next) => {
//   res.render('pages/home', {
//     title: `Home ${TITLE_FORMAT}`,
//     layout: 'master_layout/layout',
//     root: root,
//   });
// });

router.get('/home', (req, res, next) => {
  res.render('pages/homepage', {
    title: `Home ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-ver2',
    active: { home: true }
  });
});

router.get('/register', csrfProtection, (req, res, next) => {
  res.render('pages/register', {
    title: `Register UCS Request ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-ver2',
    active: { register: true },
    csrfToken: req.csrfToken()
  });
});

router.get('/ucs-tracking', csrfProtection, (req, res, next) => {
  res.render('pages/ucs-tracking', {
    title: `UCS Tracking ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-ver2',
    active: { ucsTracking: true },
    csrfToken: req.csrfToken()
  });
});

router.get('/generator', (req, res, next) => {
  res.render('pages/desc-generator', {
    title: `Description Generator ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-generator'
  });
});


router.get('/song-list', (req, res, next) => {
  res.render('pages/song', {
    title: `Song List ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-ver2',
    active: { songList: true }
  });
});

router.get('/faq-rules', (req, res, next) => {
  res.render('pages/faq-rules-temp', {
    title: `Faq & Rules ${TITLE_FORMAT}`,
    layout: 'master_layout/layout-ver2',
    active: { faqRules: true }
  });
});

router.get('/series', (req, res, next) => {
  const data = require('../../public/series.json');
  res.send(data);
});

router.get('/request-activation', activateRequestMiddleware, (req, res) => {
  requestController.activateRequest(req, res);
})

router.post('/register', csrfProtection, registerRequestMiddleware, (req, res) => {
  requestController.registerNewRequest(req, res);
})

router.post('/request-token', csrfProtection, requestTokenMiddleware, (req, res, next) => {
  requestController.requestToken(req, res);
});

router.post('/update-request', csrfProtection, updateRequestMiddleware, (req, res) => {
  requestController.updateRequestByToken(req, res);
});

router.post('/delete-request', csrfProtection, deleteRequestMiddleware, (req, res, next) => {
  requestController.deleteRequestByToken(req, res);
});

router.post('/resend-activation', csrfProtection, resendActivationMiddleware, (req, res) => {
  requestController.resendActivationEmail(req, res);
});

module.exports = router;
