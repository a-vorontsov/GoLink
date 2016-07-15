angular.module('app.filters', [])

  .filter('timestampFormatter', function () {
    return function (timestamp) {
      return moment(timestamp).fromNow();
    };
  })

  .filter('distanceFormatter', function () {
    return function (distance) {
      if (distance < 1) {
        return "<1km away";
      } else {
        return Math.round(distance) + "km away";
      }
    }
  });
