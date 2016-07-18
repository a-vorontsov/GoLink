angular.module('app.services')

  .service('userDataService', function ($window) {
    var DEFAULT_RADIUS = 15;
    var EXACT_PRECISION = 7;
    var FUZZY_PRECISION = 2;

    var data = {
      'id': null,
      'display_name': null,
      'team': null,
      'friend_code': null,
      'radius': null,
      'friends': [],
      'coordinates': {
        'latitude': null,
        'longitude': null
      }
    };

    this.setId = function (id) {
      data.id = id;
      $window.localStorage.setItem('user-id', id);
    };

    this.setDisplayName = function (displayName) {
      data.display_name = displayName;
      $window.localStorage.setItem('display-name', displayName);
    };

    this.setTeam = function (team) {
      data.team = team;
      $window.localStorage.setItem('team', team);
    };

    this.setFriendCode = function (friendCode) {
      data.friend_code = friendCode;
      $window.localStorage.setItem('friend-code', friendCode);
    };

    this.setRadius = function (radius) {
      data.radius = Number(radius);
      $window.localStorage.setItem('radius', radius);
    };

    this.setFriends = function (friends) {
      data.friends = friends;
    };

    this.setCoordinates = function (coordinates) {
      data.coordinates.latitude = coordinates[0];
      data.coordinates.longitude = coordinates[1];
    };

    this.setLatitude = function (lat) {
      data.coordinates.latitude = Number(lat);
      $window.localStorage.setItem('latitude', latitude);
    };

    this.setLongitude = function (long) {
      data.coordinates.longitude = Number(long);
      $window.localStorage.setItem('longitude', longitude);
    };

    this.getId = function () {
      if (data.id === null && $window.localStorage.getItem('user-id') !== null) {
        return $window.localStorage.getItem('user-id');
      }
      return data.id;
    };

    this.getDisplayName = function () {
      if (data.display_name === null && $window.localStorage.getItem('display-name') !== null) {
        return $window.localStorage.getItem('display-name');
      }
      return data.display_name;
    };

    this.getTeam = function () {
      if (data.team === null && $window.localStorage.getItem('team') !== null) {
        return $window.localStorage.getItem('team');
      }
      return data.team;
    };

    this.getFriendCode = function () {
      if (data.friend_code === null && $window.localStorage.getItem('friend-code') !== null) {
        return $window.localStorage.getItem('friend-code');
      }
      return data.friend_code;
    };

    this.getRadius = function () {
      if (data.radius === null && $window.localStorage.getItem('radius') !== null) {
        return $window.localStorage.getItem('radius');
      }
      return data.radius === null ? DEFAULT_RADIUS : Number(data.radius);
    };

    this.getFriends = function () {
      return data.friends;
    };

    this.getLatitude = function () {
      if (data.latitude === null && $window.localStorage.getItem('latitude') !== null) {
        return +$window.localStorage.getItem('latitude').toFixed(EXACT_PRECISION);
      }
      return +data.coordinates.latitude.toFixed(EXACT_PRECISION);
    };

    this.getLongitude = function () {
      if (data.longitude === null && $window.localStorage.getItem('longitude') !== null) {
        return +$window.localStorage.getItem('longitude').toFixed(EXACT_PRECISION);
      }
      return +data.coordinates.longitude.toFixed(EXACT_PRECISION);
    };

    this.getFuzzyLatitude = function () {
      if (data.latitude === null && $window.localStorage.getItem('latitude') !== null) {
        return +$window.localStorage.getItem('fuzzy-latitude').toFixed(FUZZY_PRECISION);
      }
      return +data.coordinates.latitude.toFixed(FUZZY_PRECISION);
    };

    this.getFuzzyLongitude = function () {
      if (data.longitude === null && $window.localStorage.getItem('longitude') !== null) {
        return +$window.localStorage.getItem('fuzzy-longitude').toFixed(FUZZY_PRECISION);
      }
      return +data.coordinates.longitude.toFixed(FUZZY_PRECISION);
    };
  });
