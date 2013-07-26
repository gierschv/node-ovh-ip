'use strict';

angular.module('ovhip', ['ovhipServices']).
  config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
    when('/', { templateUrl: '/views/_home.html', controller: HomeCtrl }).
    when('/splash', { templateUrl: '/views/_splash.html', controller: SplashCtrl }).
    when('/rules', { templateUrl: '/views/_rules.html', controller: RulesCtrl, reloadOnSearch: false }).
    when('/mitigation', { templateUrl: '/views/_mitigation.html', controller: MitigationCtrl }).
    otherwise({redirectTo: '/'});
}]).
filter('sort', function() {
  return function (input) {
    if (typeof(input) != 'undefined') {
      return input.sort();
    }
  };
}).
service('IpTools', ['$rootScope', 'IpFirewall', 'IpMitigation',  function ($rootScope, IpFirewall, IpMitigation) {
  // Generic tools
  this.long2ip = function (long) {
    var a = (long & (0xff << 24)) >>> 24,
        b = (long & (0xff << 16)) >>> 16,
        c = (long & (0xff << 8)) >>> 8,
        d = long & 0xff;
    return [a, b, c, d].join('.');
  };

  this.ip2long = function (ip_address) {
    var parts = ip_address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    return parts ? parts[1] * 16777216 + parts[2] * 65536 + parts[3] * 256 + parts[4] * 1 : false;
  };

  this.cidrToRange = function (cidr) {
    cidr = cidr.split('/');
    if (cidr.length == 1) return false;
    if (cidr[1] < 0 || cidr[1] > 32 || isNaN(cidr[1])) return false;

    if (cidr[1] == 32) {
      return [cidr[0]];
    }

    var range = [];
    var firstlong = this.ip2long(cidr[0]);
    for (var i = 0 ; i < Math.pow(2, 32 - parseInt(cidr[1], 10)) ; i++) {
      range.push(this.long2ip(firstlong + i));
    }

    return range;
  };

  // App related
  this.getIpDetails = function (ip) {
    for (var block in $rootScope.ips) {
      for (var ipKey in $rootScope.ips[block]) {
        if (ipKey == ip) {
          return {
            block: block,
            ip: ip,
            details: $rootScope.ips[block][ip]
          };
        }
      }
    }
  };

  this.listFw = function () {
    var ipFw = {};
    for (var block in $rootScope.ips) {
      for (var ip in $rootScope.ips[block]) {
        if ($rootScope.ips[block][ip].onFw) {
          ipFw[ip] = {
            block: block, ip: ip,
            fw: IpFirewall.get({ ip: block, ipOnFirewall: ip })
          };
        }
      }
    }

    return ipFw;
  };

  this.listMitigation = function () {
    var ipMitigation = {};
    for (var block in $rootScope.ips) {
      for (var ip in $rootScope.ips[block]) {
        if ($rootScope.ips[block][ip].onMitigation) {
          ipMitigation[ip] = {
            block: block, ip: ip,
            mitigation: IpMitigation.get({ ip: block, ipOnMitigation: ip })
          };
        }
      }
    }

    return ipMitigation;
  };
}]);