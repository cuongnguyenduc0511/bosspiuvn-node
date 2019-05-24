const requestController = require('../controllers/requestController');
const { TITLE_FORMAT } = require('../shared/constant');
const express = require('express');
const { activateRequestMiddleware, registerRequestMiddleware } = require('../middleware/middleware');
const csrf = require('csurf');
const csrfProtection = csrf();

var router = express.Router();

router.get('/', ({ res }) => {
    res.redirect('/home');
});

router.get('/home', (req, res, next) => {
    res.render('pages/home', {
        title: `Home ${TITLE_FORMAT}`,
        layout: 'master_layout/layout',
        root: root,
    });
});

router.get('/ucs-tracking', csrfProtection, (req, res, next) => {
    res.render('pages/ucs-tracking', {
        title: `UCS Tracking ${TITLE_FORMAT}`,
        layout: 'master_layout/layout',
        root: root,
        csrfToken: req.csrfToken()
    });
});

router.get('/ucs-song', (req, res, next) => {
    res.render('pages/song', {
        title: `Song List ${TITLE_FORMAT}`,
        layout: 'master_layout/layout2',
        root: root,
    });
});

router.get('/faq-rules', (req, res, next) => {
    res.render('pages/faq-rules', {
        title: `Faq & Rules ${TITLE_FORMAT}`,
        layout: 'master_layout/layout2',
        root: root,
    });
});

router.get('/series', (req, res, next) => {
    const data = require('../../public/series.json');
    res.send(data);
});

router.get('/register', csrfProtection, (req, res, next) => {
    res.render('pages/register', {
        title: `Register UCS ${TITLE_FORMAT}`,
        layout: 'master_layout/layout2',
        root: root,
        csrfToken: req.csrfToken()
    });
});

router.get('/request-activation', activateRequestMiddleware, (req, res) => {
    requestController.activateRequest(req, res);
})

router.post('/register', csrfProtection, registerRequestMiddleware, (req, res) => {
    requestController.registerNewRequest(req, res);
})

router.post('/request-token', csrfProtection, (req, res, next) => {
    requestController.requestToken(req, res);
});

router.post('/update-request', csrfProtection, (req, res, next) => {
    requestController.updateRequestByToken(req, res);
});

router.post('/delete-request', csrfProtection, (req, res, next) => {
    requestController.deleteRequestByToken(req, res);
});

module.exports = router;
