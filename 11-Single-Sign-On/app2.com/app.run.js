(function () {

  'use strict';

  angular
    .module('app')
    .run(run);

  run.$inject = [
    '$rootScope',
    'authService'
  ];

  function run($rootScope, authService) {
    console.log('app.run');

    // Put the authService on $rootScope so its methods
    // can be accessed from the nav bar
    $rootScope.authService = authService;

    authService.syncWithAuth0();
  }

})();
