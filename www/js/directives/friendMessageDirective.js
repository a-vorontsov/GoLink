angular.module('app.directives', [])

  .directive('friendMessage', function () {
    return {
      restrict: 'E',
      scope: {
        data: '=data'
      },
      templateUrl: 'templates/directives/friendMessage.html'
    }
  });
