'use strict';

angular.module('ovhipServices', ['ngResource']).
  factory('IpFirewall', ['$resource', function ($resource) {
    return $resource('/ip/:ip/firewall/:ipOnFirewall/:action/:actionParam', {}, {
      add: { method: 'POST' },
      enable: { method: 'PUT' },
      getRule: { method: 'GET', params: { action: 'rules' }},
      addRule: { method: 'POST', params: { action: 'rules' }},
      delRule: { method: 'DELETE', params: { action: 'rules' }}
    });
  }]);