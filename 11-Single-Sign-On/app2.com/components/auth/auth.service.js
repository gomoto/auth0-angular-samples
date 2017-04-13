(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$rootScope', 'angularAuth0', 'authManager', 'jwtHelper', '$q'];

  function authService($rootScope, angularAuth0, authManager, jwtHelper, $q) {

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
      localStorage.removeItem('access_token');
      localStorage.removeItem('profile');
      authManager.unauthenticate();
      userProfile = null;
    }

    function getProfileDeferred() {
      return deferredProfile.promise;
    }

    // Return a promise that resolves once token is set in local storage.
    function setUserToken() {
      console.log('sync with Auth0');
      // After Auth0 authenticates user, it redirects with tokens in the URL.
      const parsedHash = angularAuth0.parseHash(window.location.hash);
      if (parsedHash) {
        console.log('Auth0 tokens are in the url. That means we were redirected from Auth0.');
        console.log(parsedHash);
        localStorage.setItem('id_token', parsedHash.idToken);
        localStorage.setItem('access_token', parsedHash.accessToken);
        return $q.resolve();
      }
      // Convert callback to a promise using $q deferred API.
      const deferred = $q.defer();
      angularAuth0.getSSOData(function(err, data) {
        if (!data.sso) {
          console.log('I am logged out of single-sign-on session');
          var token = localStorage.getItem('id_token');
          if (token) {
            console.log('But local storage still has a token!', token);
            localStorage.removeItem('id_token');
          }
          login();
          return;
        }
        console.log('Single-sign-on session is active');
        console.log('These are the active clients:', data.sessionClients);
        var isThisClientLoggedIn = data.sessionClients && data.sessionClients.indexOf(AUTH0_CLIENT_ID) > -1;
        console.log('Is this client logged in?', isThisClientLoggedIn);
        if (!isThisClientLoggedIn) {
          login();
          return;
        }
        var token = localStorage.getItem('id_token');
        if (!token) {
          console.log('No token in local storage.');
          login();
          return;
        }
        if (jwtHelper.isTokenExpired(token)) {
          console.log('Token expired.');
          login();
          return;
        }
        // Token in local storage is valid.
        deferred.resolve();
      });
      return deferred.promise;
    }

    function syncWithAuth0() {
      setUserToken()
      .then(function() {
        authManager.authenticate();
        const accessToken = localStorage.getItem('access_token');
        angularAuth0.getUserInfo(accessToken, function(error, profile) {
          localStorage.setItem('profile', JSON.stringify(profile));
          deferredProfile.resolve(profile);
        });
      });
    }

    return {
      syncWithAuth0,
      login: login,
      logout: logout,
      getProfileDeferred: getProfileDeferred
    }
  }
})();
