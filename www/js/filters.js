angular.module('app.filters', [])

  .filter('timestampFormatter', function () {
    return function (timestamp) {
      if (typeof timestamp === 'undefined' || timestamp === null) {
        return 'never';
      } else {
        return moment(timestamp).fromNow();
      }
    }
  })

  .filter('distanceFormatter', function () {
    return function (distance) {
      if (distance < 1) {
        return "<1km away";
      } else {
        return Math.round(distance) + "km away";
      }
    }
  })

  .filter('friendCodeFormatter', function () {
    return function (friendCode) {
      if (typeof friendCode === 'undefined' || friendCode === null) {
        return 'N/A (Contact Support)';
      } else {
        return friendCode.substring(0, 4) + '-' + friendCode.substring(4, 8) + '-' + friendCode.substring(8, 12);
      }
    }
  });
