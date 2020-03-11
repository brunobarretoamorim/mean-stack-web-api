var config = require('config.json');
var express = require('express');
var router = express.Router();
var perguntaService = require('services/pergunta.service');

// routes
router.post('/authenticate', authenticatepergunta);
router.post('/register', registerpergunta);
router.get('/:_id', getCurrentpergunta);
router.put('/:_id', updatepergunta);
router.delete('/:_id', deletepergunta);

module.exports = router;

function authenticatepergunta(req, res) {
    perguntaService.authenticate(req.body.perguntaname, req.body.password)
        .then(function (response) {
            if (response) {
                // authentication successful
                res.send({ perguntaId: response.perguntaId, token: response.token });
            } else {
                // authentication failed
                res.status(401).send('perguntaname or password is incorrect');
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function registerpergunta(req, res) {
    perguntaService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrentpergunta(req, res) {
    perguntaService.getById(req.params._id)
        .then(function (pergunta) {
            if (pergunta) {
                res.send(pergunta);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updatepergunta(req, res) {
    perguntaService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deletepergunta(req, res) {
    perguntaService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}