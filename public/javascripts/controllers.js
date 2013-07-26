'use strict';

function SplashCtrl($rootScope, $scope, $http, $location, $routeParams, IpTools) {
  $rootScope.ips = null;
  $scope.state = { total: 0, done: 0 };

  if (typeof(window.localStorage) != 'undefined') {
    try {
      $rootScope.ips = JSON.parse(window.localStorage.getItem('ovh_ips'));
    }
    catch(e) {
      $rootScope.ips = null;
    }
  }

  if ($rootScope.ips !== null && !$routeParams.refresh) {
    return $location.path($routeParams.next ? $routeParams.next : '/');
  }

  $rootScope.ips = {};

  async.waterfall([
    function (callback) {
      $http.get('/ip').success(callback.bind(this, false));
    },
    function (ips, httpCode, callback) {
      $scope.state.total = ips.length;
      async.each(ips, function (block, callback) {
        $rootScope.ips[block] = {};
        var ipList = IpTools.cidrToRange(block);
        for (var i = 0 ; i < ipList.length ; ++i) {
          $rootScope.ips[block][ipList[i]] = {};
        }

        $http
          .get('/ip/' + encodeURIComponent(block) + '/firewall')
          .success(function (ip) {
            $scope.state.done++;
            for (var i = 0 ; i < ip.length ; ++i) {
              $rootScope.ips[block][ip[i]].onFw = true;
            }
            callback(null);
          })
          .error(callback.bind(this, false));
      }, function (err) {
        if (typeof(window.localStorage) != 'undefined') {
          window.localStorage.setItem('ovh_ips', JSON.stringify($rootScope.ips));
        }

        $location.path($routeParams.next ? $routeParams.next : '/');
        callback();
      });
    }
  ]);
}

SplashCtrl.$inject = [
  '$rootScope', '$scope', '$http', '$location', '$routeParams', 'IpTools'
];

function HomeCtrl($rootScope, $scope, $location, $routeParams, $http, IpTools, IpFirewall) {
  $scope.refresh = function (noForce) {
    return $location.path('/splash').search({
      refresh: !noForce, showAll: $scope.showAll
    });
  };

  if (!$rootScope.ips) {
    $scope.refresh(true);
  }

  if ($routeParams.showAll) {
    $scope.showAll = true;
  }

  $scope.list = function () {
    $scope.ipFw = IpTools.listFw();
  };

  $scope.list();

  $scope.errors = [];
  $scope.success = false;
  $scope.action = 'add';

  $scope.actions = {
    'add': { method: 'add' },
    'remove': { method: 'remove' },
    'enable': { method: 'enable', params: { enabled: true } },
    'disable': { method: 'enable', params: { enabled: false } }
  };

  for (var a in $scope.actions) {
    $scope[a] = function (method, params, block, ip, callback) {
      var route = { ip: block, ipOnFirewall: ip };
      params = params || {};

      if (method === 'add') {
        params.ipOnFirewall = ip;
        delete route.ipOnFirewall;
      }

      IpFirewall[method](route, params,
        function (res) {
          callback && callback(null, res);
        },
        function (err) {
          $scope.errors.push(err);
          callback && callback(err);
        }
      );
    }.bind(this, $scope.actions[a].method, $scope.actions[a].params);
  }

  $scope.process = function () {
    $scope.errors = [];
    async.map($scope.ipsmodify.split('\n'), function (ip, callback) {
      var ipDetails = IpTools.getIpDetails(ip);
      $scope[$scope.action].call(this, ipDetails.block, ip, callback);
    }, function (err, ips) {
      if (err) {
        // $scope.errors.push(err);
      }
      else {
        $scope.success = true;
      }
    });
  };
}

HomeCtrl.$inject = [
  '$rootScope', '$scope', '$location', '$routeParams', '$http', 'IpTools', 'IpFirewall'
];

function RulesCtrl($rootScope, $scope, $location, $routeParams, $http, IpTools, IpFirewall) {
  if (!$rootScope.ips) {
    return $location.path('/splash').search({ next: '/rules', ip: $routeParams.ip });
  }

  $scope.errors = [];
  $scope.success = false;

  if ($routeParams.ip) {
    $scope.ip = $routeParams.ip;
  }

  $scope.list = function () {
    $scope.ipFw = IpTools.listFw();
    var ipDetails = IpTools.getIpDetails($scope.ip);

    if (typeof(ipDetails) == 'undefined') {
      return;
    }

    $location.search({ ip: $scope.ip });
    $scope.block = ipDetails.block;

    $http
      .get('/ip/' + encodeURIComponent($scope.block) + '/firewall/' + $scope.ip + '/rules')
      .success(function (rules) {
        async.map(rules, function (rule, callback) {
          IpFirewall.getRule({
            ip: $scope.block, ipOnFirewall: $scope.ip, actionParam: rule
          }, function (rule) {
            callback(null, rule);
          }, function (err) {
            callback(err);
          });
        }, function (err, rules) {
          if (err) {
            $acope.errors.push(err);
          }
          else {
            $scope.rules = rules;
          }
        });
      });
  };

  $scope.list();

  $scope.$watch('ip', $scope.list);
  $scope.$watch('newRulesRaw', function () {
    $scope.newRules = [];
    if (typeof($scope.newRulesRaw) == 'undefined') {
      return;
    }

    var rules = $scope.newRulesRaw.split('\n'),
        options = ['urg','psh','ack','syn','fin','rst','established','fragments'],
        rgx_ipv4 = /^0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/,
        rgx_bloc_ipv4 = /^0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\/([0-9]+)$/;

    for (var i = 0 ; i < rules.length ; ++i) {
      var rule = { options: []}, ruleRaw = rules[i].split(' ');
      if (ruleRaw.length < 4) {
        continue;
      }

      rule.sequence = parseInt(ruleRaw.shift(), 10);
      rule.action = ruleRaw.shift();
      if (rule.action !== 'permit' && rule.action !== 'deny') {
        rule.error = 'action';
      }

      rule.protocol = ruleRaw.shift();
      if (rule.protocol !== 'ipv4' && rule.protocol !== 'icmp' &&
          rule.protocol !== 'tcp' && rule.protocol !== 'udp') {
        rule.error = 'protocol';
      }

      while (ruleRaw.length > 0) {
        var str = ruleRaw.shift();

        // ip src
        if (rgx_bloc_ipv4.test(str) || str === 'any') {
          rule.ip_src = str;
          continue;
        }

        // ip dst
        if (rgx_ipv4.test(str) && IpTools.getIpDetails(str)) {
          rule.ip_dst = str;
          continue;
        }

        // ports
        if (str === 'eq' && ruleRaw.length > 0) {
          if (typeof(rule.ip_dst) == 'undefined') {
            rule.port_src = [ruleRaw.shift()];
            if (/^\+?(0|[1-9]\d*)$/.test(ruleRaw[0])) {
              rule.port_src.push(ruleRaw.shift());
            }
            else {
              rule.port_src.push(rule.port_src[0]);
            }
          }
          else {
            rule.port_dst = [ruleRaw.shift()];
            if (/^\+?(0|[1-9]\d*)$/.test(ruleRaw[0])) {
              rule.port_dst.push(ruleRaw.shift());
            }
            else {
              rule.port_dst.push(rule.port_dst[0]);
            }
          }
          continue;
        }

        // options
        if (options.indexOf(str) >= 0) {
          rule.options.push(str);
          continue;
        }

        rule.error = 'Unknown ' + str;
      }

      $scope.newRules.push(rule);
    }
  });

  $scope.process = function () {
    $scope.errors = [];
    async.each($scope.newRules, function (rule, callback) {
      var body = {
        action: rule.action,
        protocol: rule.protocol,
        sequence: rule.sequence,
        source: rule.ip_src == 'any' ? null : rule.ip_src,
        tcpOption: {},
        udpOption: {}
      };

      // issue with request ? invalid usage with tcpOption...
      for (var i = 0 ; i < rule.options.length ; ++i) {
        if (rule.options[i] === 'fragments') {
          body.udpOption.fragments = true;
        }
        else {
          body.tcpOption[rule.options[i]] = true;
        }
      }

      if (typeof(rule.port_src) != 'undefined' && rule.port_src.length > 1) {
        body.sourcePort = { from: rule.port_src[0], to: rule.port_src[1] };
      }

      if (typeof(rule.port_dst) != 'undefined' && rule.port_dst.length > 1) {
        body.destinationPort = { from: rule.port_dst[0], to: rule.port_dst[1] };
      }

      IpFirewall.addRule({
        ip: IpTools.getIpDetails(rule.ip_dst).block,
        ipOnFirewall: rule.ip_dst
      }, body, function (res) {
        callback(null, res);
      }, function (err) {
        callback(err);
      });
    }, function (err) {
      if (err) {
        $scope.errors.push(err);
      }
      else {
        $scope.newRulesRaw = '';
        $scope.success = true;
      }

      $scope.list();
    });
  };

  $scope.remove = function (seq) {
    IpFirewall.delRule({
      ip: $scope.block, ipOnFirewall: $scope.ip, actionParam: seq
    }, function (rule) {
      $scope.success = true;
      $scope.list();
    }, function (err) {
      $scope.errors.push(err);
    });
  };
}

RulesCtrl.$inject = [
  '$rootScope', '$scope', '$location', '$routeParams', '$http', 'IpTools', 'IpFirewall'
];
