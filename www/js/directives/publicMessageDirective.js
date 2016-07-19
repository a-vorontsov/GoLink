angular.module('app.directives')

  .directive('publicMessage', function () {
    return {
      restrict: 'E',
      scope: {
        data: '=data'
      },
      templateUrl: 'templates/directives/publicMessage.html'
    }
  });
