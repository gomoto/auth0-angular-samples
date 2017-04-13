(function () {

  'use strict';

  angular
    .module('app')
    .config(config);

  config.$inject = [
    '$httpProvider',
    'jwtOptionsProvider',
    '$stateProvider',
    '$locationProvider',
    '$urlRouterProvider',
    'angularAuth0Provider'
  ];

  function config(
    $httpProvider,
    jwtOptionsProvider,
    $stateProvider,
    $locationProvider,
    $urlRouterProvider,
    angularAuth0Provider
  ) {
    console.log('app.config');

    $locationProvider.html5Mode(true);

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

    // Initialization for the angular-auth0 library
    angularAuth0Provider.init({
      clientID: AUTH0_CLIENT_ID,
      domain: AUTH0_DOMAIN
    });

    $urlRouterProvider.otherwise('/home');

    // Configure angular-jwt
    jwtOptionsProvider.config({
      tokenGetter: [function() {
        var token = localStorage.getItem('id_token');
        console.log('angular-jwt token getter', token);
        return token;
      }]
    });

    // Add Authorization header to requests
    $httpProvider.interceptors.push('jwtInterceptor');

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
