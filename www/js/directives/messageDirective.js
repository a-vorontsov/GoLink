angular.module('app.directives')

  .directive('message', function () {
    return {
      restrict: 'E',
      scope: {
        data: '=data'
      },
      templateUrl: 'templates/directives/message.html'
    }
  });
