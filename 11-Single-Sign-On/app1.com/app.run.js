(function () {

  'use strict';

  angular
    .module('app')
    .run(run);

  run.$inject = [
    '$rootScope',
    'authService',
    'lock',
    '$timeout'
  ];

  function run($rootScope, authService, lock, $timeout) {
    console.log('app.run');

    // Put the authService on $rootScope so its methods
    // can be accessed from the nav bar
    $rootScope.authService = authService;

    // Register the authentication listener that is
    // set up in auth.service.js
    authService.registerAuthenticationListener();

    authService.syncWithAuth0();

    // Register synchronous hash parser
    lock.interceptHash();
  }

})();
