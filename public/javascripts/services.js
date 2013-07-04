'use strict';

angular.module('ovhipServices', ['ngResource']).
  factory('IpAdd', ['$resource', function ($resource) {  
    return $resource('/ip/firewall', {}, {
      add: { method: 'POST' }
    });
  }]).
  factory('Ip', ['$resource', function ($resource) {  
    return $resource('/ip/firewall/:ipOnFirewall', { ipOnFirewall: '@ipOnFirewall' }, {
      put: { method: 'PUT' }
    });
  }]).
  factory('IpTask', ['$resource', function ($resource) {  
    return $resource('/ip/firewall/:ipOnFirewall/tasks/:id', {
      ipOnFirewall: '@ipOnFirewall', id: '@id'
    });
  }]).
  factory('FirewallRule', ['$resource', function ($resource) {  
    return $resource('/ip/firewall/:ipOnFirewall/rules/:sequence', {
      ipOnFirewall: '@ipOnFirewall', sequence: '@sequence'
    });
  }]).
  factory('PutFirewallRule', ['$resource', function ($resource) {  
    return $resource('/ip/firewall/:ipOnFirewall/rules', { ipOnFirewall: '@ipOnFirewall' }, {
      post: { method: 'POST' }
    });
  }])