angular.module('app.services', [])

  .service('userDataService', function () {
    var DEFAULT_RADIUS = 15;
    var FUZZY_PRECISION = 2;

    var data = {
      'id': null,
      'display_name': null,
      'team': null,
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

    this.getRadius = function() {
      return data.radius === null ? DEFAULT_RADIUS : Number(data.radius);
    };

    this.getCoordinates = function() {
      return {
        'latitude': Number(data.coordinates.latitude),
        'longitude': Number(data.coordinates.longitude)
      };
    };

    this.getLatitude = function () {
      return Number(data.coordinates.latitude);
    };

    this.getLongitude = function () {
      return Number(data.coordinates.longitude);
    };

    this.getFuzzyLatitude = function() {
      return +data.coordinates.latitude.toFixed(FUZZY_PRECISION);
    };

    this.getFuzzyLongitude = function() {
      return +data.coordinates.longitude.toFixed(FUZZY_PRECISION);
    };
  });
