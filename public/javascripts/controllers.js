'use strict';

function HomeCtrl($scope, $http, Ip, IpAdd) {
  $scope.errors = [];
  $scope.success = false;
  $scope.action = 'add';

  // List
  $scope.list = function () {
    $http.get('/ip/firewall').success(function (ips) {
      $scope.ips = [];

      async.map(ips, function (ip, callback) {
        Ip.get({ ipOnFirewall: ip }, function (ip) {
          callback(null, ip);
        });
      }, function (err, ips) {
        if (err) {
          $scope.errors.push(err);
        }
        else {
          $scope.ips = ips;
        }
      });
    });
  };
  $scope.list();

  $scope.add = function (ip, callback) {
    IpAdd.add({ ip: ip }, function (res) {
      callback(null, res);
    }, function (err) {
      $scope.errors.push(err);
      callback(err);
    });
  };

  $scope.enable = function (ip, callback) {
    Ip.put({ ipOnFirewall: ip }, { enabled: true }, function (res) {
      callback(null, res);
    }, function (err) {
      $scope.errors.push(err);
      callback(err);
    });
  };

  $scope.disable = function (ip, callback) {
    Ip.put({ ipOnFirewall: ip }, { enabled: false }, function (res) {
      callback(null, res);
    }, function (err) {
      $scope.errors.push(err);
      callback(err);
    });
  };

  $scope.remove = function (ip, callback) {
    Ip.remove({ ipOnFirewall: ip }, function (res) {
      callback(null, res);
    }, function (err) {
      $scope.errors.push(err);
      callback(err);
    });
  };

  $scope.process = function () {
    $scope.errors = [];
    async.map($scope.ipsmodify.split('\n'), function (ip, callback) {
      $scope[$scope.action].call(this, ip, callback);
    }, function (err, ips) {
      if (err) {
        // $scope.errors.push(err);
      }
      else {
        $scope.success = true;
      }
    });
  };
};

HomeCtrl.$inject = ['$scope', '$http', 'Ip', 'IpAdd'];

function TasksCtrl($scope, $http, IpTask) {
  $scope.errors = [];
  $scope.success = false;
  $scope.action = 'add';

  // List
  $http.get('/ip/firewall').success(function (ips) {
    $scope.ips = ips;
  });

  $scope.$watch('ip', function() {
    if (typeof($scope.ip) != 'undefined') {
      $http.get('/ip/firewall/' + $scope.ip + '/tasks').success(function (tasks) {
        async.map(tasks, function (task, callback) {
          IpTask.get({ ipOnFirewall: $scope.ip, id: task }, function (task) {
            callback(null, task);
          });
        }, function (err, tasks) {
          if (err) {
            $errors.push(err);
          }
          
          $scope.tasks = tasks;
        });
      });
    }
  });

  $scope.remove = function (ip, task) {
    IpTask.delete({ ipOnFirewall: ip, id: task });
  };
};

TasksCtrl.$inject = ['$scope', '$http', 'IpTask'];

function RulesCtrl($scope, $http, FirewallRule, PutFirewallRule) {
  $scope.errors = [];
  $scope.success = false;
  $scope.action = 'add';

  // List
  $http.get('/ip/firewall').success(function (ips) {
    $scope.ips = ips;
  });

  $scope.list = function () {
    if (typeof($scope.ip) == 'undefined') {
      return;
    }

    $http.get('/ip/firewall/' + $scope.ip + '/rules').success(function (rules) {
      async.map(rules, function (rule, callback) {
        FirewallRule.get({ ipOnFirewall: $scope.ip, sequence: rule }, function (rule) {
          callback(null, rule);
        }, function (err) {
          callback(err);
        })
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
        if (rgx_ipv4.test(str) && $scope.ips.indexOf(str) >= 0) {
          rule.ip_dst = str;
          continue;
        }

        // ports
        if (str === 'range' && ruleRaw.length > 0) {
          if (typeof(rule.ip_dst) == 'undefined') {
            rule.port_src = [ruleRaw.shift(), ruleRaw.shift()];
          }
          else {
            rule.port_dst = [ruleRaw.shift(), ruleRaw.shift()];
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
        source: rule.ip_src,
        tcpOption: {},
        udpOption: {}
      };

      // issue with request ? invalid usage with tcpOption...
      for (var i = 0 ; i < rule.options.length ; ++i) {
        if (rule.options[i] === 'fragments') {
          body.udpOption['fragments'] = true;
        }
        else {
          body.tcpOption[rule.options[i]] = true;
        }
      }

      if (typeof(rule.port_src) != 'undefined' && rule.port_src.length > 1) {
        body.sourcePort = { from: rule.port_src[0], to: rule.port_src[1] };
      }

      if (typeof(rule.port_dst_) != 'undefined' && rule.port_dst.length > 1) {
        body.destinationPort = { from: rule.port_dst[0], to: rule.port_dst[1] };
      }

      PutFirewallRule.post({ipOnFirewall: rule.ip_dst}, body, function (res) {
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
    });
  };

  $scope.remove = function (seq) {
    FirewallRule.delete({ ipOnFirewall: $scope.ip, sequence: seq }, function (rule) {
      $scope.success = true;
    }, function (err) {
      $scope.errors.push(err);
    });
  };
};

RulesCtrl.$inject = ['$scope', '$http', 'FirewallRule', 'PutFirewallRule'];
