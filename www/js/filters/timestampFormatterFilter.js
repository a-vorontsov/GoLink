angular.module('app.filters')

  .filter('timestampFormatter', function () {
    return function (timestamp) {
      if (typeof timestamp === 'undefined' || timestamp === null) {
        return 'never';
      } else {
        return moment(timestamp).fromNow();
      }
    }
  });
