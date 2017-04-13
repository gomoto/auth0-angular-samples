(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$rootScope', 'angularAuth0', 'authManager', 'jwtHelper', '$q'];

  function authService($rootScope, angularAuth0, authManager, jwtHelper, $q) {
    // Remember user profile after first fetch.
    var userProfile = null;

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
      userProfile = null;
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      authManager.unauthenticate();
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
        if (err) {
          deferred.reject(err);
        }
        // If user is not logged in to any app, log in.
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

        // If user is not logged in to this app, log in.
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

        // If token is unreadable, get a new one.
        try {
          jwtHelper.decodeToken(token);
        }
        catch (e) {
          console.log('Cannot decode token');
          login();
          return;
        }

        // If token is expired, get a new one.
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
        $rootScope.$emit('authenticated');
      })
      .catch(function() {
        console.error('An error occurred while authenticating');
      });
    }

    // Call callback once authenticated.
    function onceAuthenticated(callback) {
      if (authManager.isAuthenticated()) {
        callback();
        return;
      }
      $rootScope.$on('authenticated', () => {
        callback();
      });
    }

    // Return a promise that resolves with the user profile.
    function getUserProfile() {
      if (userProfile) {
        return $q.resolve(userProfile);
      }
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        return $q.reject('No access token');
      }
      const deferred = $q.defer();
      angularAuth0.getUserInfo(accessToken, function(error, profile) {
        if (error) {
          deferred.reject(error);
        }
        userProfile = profile;
        deferred.resolve(profile);
      });
      return deferred.promise;
    }

    return {
      syncWithAuth0,
      login: login,
      logout: logout,
      onceAuthenticated,
      getUserProfile
    }
  }
})();
