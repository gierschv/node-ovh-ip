var config = require('config'),
    ovh = require('ovh');

exports.index = function(req, res) {
  if (typeof(req.session.ovh_ck) == 'undefined') {
    var rest = ovh({}, {
      appKey: config.ovh.appKey, appSecret: config.ovh.appSecret
    });

    rest.auth.credential.$post({
      accessRules: [
        { method: 'GET', 'path': '/ip*'},
        { method: 'POST', 'path': '/ip*'},
        { method: 'PUT', 'path': '/ip*'},
        { method: 'DELETE', 'path': '/ip*'}
      ],
      redirection: config.app.baseUrl
    }, function (success, credentials) {
      req.session.ovh_ck = credentials.consumerKey;
      if (!success) {
        res.send(500);
      }
      else {
        res.redirect(credentials.validationUrl);
      }
    });
  }
  else {
    res.render('layout.html');
  }
};

exports.ip = function (req, res) {
  if (typeof(req.session.ovh_ck) == 'undefined') {
    return res.send(400);
  }

  var rest = ovh({
    ip: { type: 'REST', path: '/ip'}
  }, {
    appKey: config.ovh.appKey, appSecret: config.ovh.appSecret,
    consumerKey: req.session.ovh_ck
  });

  rest.ip.call(req.originalMethod, req.url, req.body, function (success, result, errmsg) {
    if (!success) {
      return res.send(400, errmsg);
    }
    
    res.send(200, result);
  });
};