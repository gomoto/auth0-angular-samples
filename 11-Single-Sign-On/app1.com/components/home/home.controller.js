(function () {

  'use strict';

  angular
    .module('app')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['authService'];

  function HomeController(authService) {

    var vm = this;
    vm.authService = authService;

    vm.profile = null;
    authService.onceAuthenticated(() => {
      authService.getUserProfile()
      .then(function (profile) {
        console.log('Setting user profile');
        vm.profile = profile;
      });
    });

    vm.logoutFromAuth0 = function() {
      authService.logout();
    }

  }

}());
