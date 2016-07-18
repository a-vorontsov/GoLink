angular.module('app.filters')

  .filter('friendCodeFormatter', function () {
    return function (friendCode) {
      if (typeof friendCode === 'undefined' || friendCode === null) {
        return 'N/A (Contact Support)';
      } else {
        return friendCode.substring(0, 4) + '-' + friendCode.substring(4, 8) + '-' + friendCode.substring(8, 12);
      }
    }
  });
