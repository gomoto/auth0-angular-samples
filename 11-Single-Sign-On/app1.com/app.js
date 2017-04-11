(function () {

  'use strict';

  angular
    .module('app', ['auth0.auth0', 'auth0.lock', 'angular-jwt', 'ui.router'])
    .config(config);

  config.$inject = [
    '$httpProvider',
    '$stateProvider',
    'lockProvider',
    '$urlRouterProvider',
    'angularAuth0Provider'
  ];

  function config(
    $httpProvider,
    $stateProvider,
    lockProvider,
    $urlRouterProvider,
    angularAuth0Provider
  ) {
    console.log('app.config');

    $stateProvider
      .state('home', {
        url: '/home',
        controller: 'HomeController',
        templateUrl: 'components/home/home.html',
        controllerAs: 'vm'
      })
      .state('login', {
        url: '/login',
        controller: 'LoginController',
        templateUrl: 'components/login/login.html',
        controllerAs: 'vm'
      });

    lockProvider.init({
      clientID: AUTH0_CLIENT_ID,
      domain: AUTH0_DOMAIN,
      options: {
        _idTokenVerification: false
      }
    });

    // Initialization for the angular-auth0 library
    angularAuth0Provider.init({
      clientID: AUTH0_CLIENT_ID,
      domain: AUTH0_DOMAIN
    });

    $urlRouterProvider.otherwise('/home');

    // Log request headers
    $httpProvider.interceptors.push(function() {
      return {
        request: function(config) {
          console.log('$http request headers:', config.headers);
          return config;
        }
      };
    });
  }

})();
