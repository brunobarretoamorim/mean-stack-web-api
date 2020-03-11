var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('perguntas');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(perguntaname, password) {
    var deferred = Q.defer();

    db.perguntas.findOne({ perguntaname: perguntaname }, function (err, pergunta) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (pergunta && bcrypt.compareSync(password, pergunta.hash)) {
            // authentication successful
            deferred.resolve({token :jwt.sign({ sub: pergunta._id }, config.secret), perguntaId: pergunta._id});
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.perguntas.findById(_id, function (err, pergunta) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (pergunta) {
            // return pergunta (without hashed password)
            deferred.resolve(_.omit(pergunta, 'hash'));
        } else {
            // pergunta not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(perguntaParam) {
    var deferred = Q.defer();

    // validation
    db.perguntas.findOne(
        { perguntaname: perguntaParam.perguntaname },
        function (err, pergunta) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (pergunta) {
                // perguntaname already exists
                deferred.reject('perguntaname "' + perguntaParam.perguntaname + '" is already taken');
            } else {
                createpergunta();
            }
        });

    function createpergunta() {
        // set pergunta object to perguntaParam without the cleartext password
        var pergunta = _.omit(perguntaParam, 'password');

        // add hashed password to pergunta object
        pergunta.hash = bcrypt.hashSync(perguntaParam.password, 10);

        db.perguntas.insert(
            pergunta,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, perguntaParam) {
    var deferred = Q.defer();

    // validation
    db.perguntas.findById(_id, function (err, pergunta) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (pergunta.perguntaname !== perguntaParam.perguntaname) {
            // perguntaname has changed so check if the new perguntaname is already taken
            db.perguntas.findOne(
                { perguntaname: perguntaParam.perguntaname },
                function (err, pergunta) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (pergunta) {
                        // perguntaname already exists
                        deferred.reject('perguntaname "' + req.body.perguntaname + '" is already taken')
                    } else {
                        updatepergunta();
                    }
                });
        } else {
            updatepergunta();
        }
    });

    function updatepergunta() {
        // fields to update
        var set = {
            firstName: perguntaParam.firstName,
            lastName: perguntaParam.lastName,
            perguntaname: perguntaParam.perguntaname,
        };

        // update password if it was entered
        if (perguntaParam.password) {
            set.hash = bcrypt.hashSync(perguntaParam.password, 10);
        }

        db.perguntas.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.perguntas.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}