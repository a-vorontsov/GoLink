angular.module('app.directives')

/*
 * Applies the timestampFormatter filter on a repeating basis
 * Source: http://stackoverflow.com/a/15592046
 */
  .directive('timestamp', function ($timeout, $filter) {
    return {
      restrict: 'A',
      scope: false,
      link: function (scope, element, attrs) {
        var TIME_TEN_SECONDS = 10000;
        var TIME_ONE_MINUTE = 60000;
        var TIME_TEN_MINUTES = 600000;

        var timestamp;
        var timeoutId;
        var intervalLength;
        var filter = $filter('timestampFormatter');

        function updateTime() {
          element.text(filter(timestamp));
        }

        function updateLater() {
          timeoutId = $timeout(function () {
            var timestampDifference = Date.now() - timestamp;
            if (timestampDifference >= TIME_ONE_MINUTE) {
              intervalLength = TIME_ONE_MINUTE;
            } else if (timestampDifference >= TIME_TEN_MINUTES) {
              intervalLength = TIME_TEN_MINUTES
            }
            updateTime();
            updateLater();
          }, intervalLength);
        }

        element.bind('$destroy', function () {
          $timeout.cancel(timeoutId);
        });

        attrs.$observe('timestamp', function (value) {
          if (value) {
            timestamp = Number(value);
            intervalLength = TIME_TEN_SECONDS;
            updateTime();
            updateLater();
          }
        });
      }
    }
  });
