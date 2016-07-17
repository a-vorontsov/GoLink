angular.module('app.services', [])

  .service('userDataService', function () {
    var DEFAULT_RADIUS = 15;
    var EXACT_PRECISION = 7;
    var FUZZY_PRECISION = 2;

    var data = {
      'id': null,
      'display_name': null,
      'team': null,
      'friend_code': null,
      'radius': null,
      'coordinates': {
        'latitude': null,
        'longitude': null
      }
    };

    this.setId = function (id) {
      data.id = id;
    };

    this.setDisplayName = function (displayName) {
      data.display_name = displayName;
    };

    this.setTeam = function (team) {
      data.team = team;
    };

    this.setFriendCode = function (friendCode) {
      data.friend_code = friendCode;
    };

    this.setRadius = function(radius) {
      data.radius = Number(radius);
    };

    this.setCoordinates = function(coordinates) {
      data.coordinates.latitude = coordinates[0];
      data.coordinates.longitude = coordinates[1];
    };

    this.setLatitude = function (lat) {
      data.coordinates.latitude = Number(lat);
    };

    this.setLongitude = function (long) {
      data.coordinates.longitude = Number(long);
    };

    this.getId = function () {
      return data.id;
    };

    this.getDisplayName = function () {
      return data.display_name;
    };

    this.getTeam = function () {
      return data.team;
    };

    this.getFriendCode = function () {
      return data.friend_code;
    };

    this.getRadius = function() {
      return data.radius === null ? DEFAULT_RADIUS : Number(data.radius);
    };

    this.getLatitude = function () {
      return +data.coordinates.latitude.toFixed(EXACT_PRECISION);
    };

    this.getLongitude = function () {
      return +data.coordinates.longitude.toFixed(EXACT_PRECISION);
    };

    this.getFuzzyLatitude = function() {
      return +data.coordinates.latitude.toFixed(FUZZY_PRECISION);
    };

    this.getFuzzyLongitude = function() {
      return +data.coordinates.longitude.toFixed(FUZZY_PRECISION);
    };
  });
