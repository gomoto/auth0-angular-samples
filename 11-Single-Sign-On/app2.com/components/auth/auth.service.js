(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$rootScope', 'lock', 'angularAuth0', 'authManager', 'jwtHelper', '$q'];

  function authService($rootScope, lock, angularAuth0, authManager, jwtHelper, $q) {

    var userProfile = JSON.parse(localStorage.getItem('profile')) || null;
    var deferredProfile = $q.defer();

    if (userProfile) {
      deferredProfile.resolve(userProfile);
    }

    // Redirects to auth0.com
    function login() {
      angularAuth0.login({
        scope: 'openid name picture',
        responseType: 'token'
      });
    }

    // Redirects to auth0.com
    function logout() {
      angularAuth0.logout({
        client_id: AUTH0_CLIENT_ID,
        returnTo: `${window.location.protocol}//${window.location.host}`
      });
      deferredProfile = $q.defer();
      localStorage.removeItem('id_token');
      localStorage.removeItem('profile');
      authManager.unauthenticate();
      userProfile = null;
    }

    // Set up the logic for when a user authenticates
    // This method is called from app.run.js
    function registerAuthenticationListener() {
      lock.on('authenticated', function (authResult) {
        console.log(`authenticated. setting token in localStorage ${authResult.idToken}`);
        localStorage.setItem('id_token', authResult.idToken);
        authManager.authenticate();

        lock.getProfile(authResult.idToken, function (error, profile) {
          if (error) {
            return console.log(error);
          }

          localStorage.setItem('profile', JSON.stringify(profile));
          deferredProfile.resolve(profile);
        });

      });

      lock.on('authorization_error', function (err) {
        console.log(err);
      });
    }

    function getProfileDeferred() {
      return deferredProfile.promise;
    }

    function syncWithAuth0() {
      console.log('sync with Auth0');
      angularAuth0.getSSOData(function(err, data) {
        if (!data.sso) {
          console.log('I am logged out of single-sign-on session');
          var token = localStorage.getItem('id_token');
          if (token) {
            console.log('But local storage still has a token!', token);
            localStorage.removeItem('id_token');
          }
          angularAuth0.signin({
            scope: 'openid name picture',
            responseType: 'token'
          });
          return;
        }
        console.log('Single-sign-on session is active');
        console.log('These are the active clients:', data.sessionClients);
        var isThisClientLoggedIn = data.sessionClients && data.sessionClients.indexOf(AUTH0_CLIENT_ID) > -1;
        console.log('Is this client logged in?', isThisClientLoggedIn);
        if (!isThisClientLoggedIn) {
          // Can we do this async to prevent double-load?
          angularAuth0.signin({
            scope: 'openid name picture',
            responseType: 'token'
          });
          return;
        }
        var token = localStorage.getItem('id_token');
        var isTokenExpired = jwtHelper.isTokenExpired(token);
        console.log('Is token expired?', isTokenExpired);
        if (isTokenExpired) {
          // Can we do this async to prevent double-load?
          angularAuth0.signin({
            scope: 'openid name picture',
            responseType: 'token'
          });
          return;
        }
        authManager.authenticate();
      });
    }

    return {
      syncWithAuth0,
      login: login,
      logout: logout,
      registerAuthenticationListener: registerAuthenticationListener,
      getProfileDeferred: getProfileDeferred
    }
  }
})();
