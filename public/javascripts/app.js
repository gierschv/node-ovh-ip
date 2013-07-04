'use strict';

angular.module('ovhip', ['ovhipServices']).
  config(['$routeProvider', function ($routeProvider) {
  $routeProvider.
    when('/', { templateUrl: '/views/_home.html', controller: HomeCtrl }).
    when('/tasks', { templateUrl: '/views/_tasks.html', controller: TasksCtrl }).
    when('/rules', { templateUrl: '/views/_rules.html', controller: RulesCtrl }).
    otherwise({redirectTo: '/'});
}]).filter('sort', function() {
  return function(input) {
    if (typeof(input) != 'undefined') {
      return input.sort();
    }
  }
});