angular.module('app.controllers')
  .controller('publicMessagesCtrl', function ($scope, $timeout, $cordovaGeolocation, $ionicScrollDelegate, $ionicPopup, userDataService) {
    $scope.isLoading = true;
    $timeout(function () {
      $scope.isLoading = false;
      $ionicScrollDelegate.scrollBottom(true);
    }, 2000);

    $scope.data = {'message': ''};
    $scope.messages = [];

    var sentMessageKeys = [];
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    var geoFire = new GeoFire(firebase.database().ref('public_message_locations'));

    /*
     * Helper Functions
     */

    function transferGeoQueryResultFromFirebaseToScope(key, location, distance) {
      firebase.database().ref('/public_messages/' + key).once('value').then(function (snapshot) {
        if (snapshot.exists() && snapshot.hasChild('timestamp') && snapshot.hasChild('user')) {
          // Update user data service
          var messageSnapshot = snapshot.val();
          $scope.messages.push({
            'key': key,
            'distance': distance,
            'timestamp': messageSnapshot.timestamp,
            'type': typeof(messageSnapshot.longitude) === 'undefined' ? 'message' : 'location',
            'message': messageSnapshot.message,
            'longitude': messageSnapshot.longitude,
            'latitude': messageSnapshot.latitude,
            'user': {
              'user_id': messageSnapshot.user.user_id,
              'display_name': messageSnapshot.user.display_name,
              'team': messageSnapshot.user.team,
              'is_me': messageSnapshot.user.user_id === userDataService.getId()
            }
          });
          // Sort by timestamp
          $timeout(function () {
            $scope.messages.sort(function (x, y) {
              return x.timestamp - y.timestamp;
            });
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollBottom(true);
          });
        }
      }, function (error) {
        if (!error.message.indexOf('permission_denied') > 1) {
          throw error;
        }
      });
    }

    function listenForGeoQueryMessages() {
      var geoQuery = geoFire.query({
        center: [userDataService.getLatitude(), userDataService.getLongitude()],
        radius: userDataService.getRadius()
      });
      geoQuery.on("key_entered", function (key, location, distance) {
        if (sentMessageKeys.indexOf(key) === -1) {
          transferGeoQueryResultFromFirebaseToScope(key, location, distance);
        }
      });
    }

    function sendPublicMessageWithData(data) {
      // Create a message
      var newMessageRef = firebase.database().ref('public_messages').push();
      sentMessageKeys.push(newMessageRef.key);

      // Set the message
      newMessageRef.set(data, function (error) {
        if (!error) {
          // Set the GeoFire instance of the message
          geoFire.set(newMessageRef.key, [userDataService.getFuzzyLatitude(), userDataService.getFuzzyLongitude()]).then();
        }
      });
    }

    function addLocalMessageToScope(data) {
      $scope.messages.push({
        'key': '',
        'distance': 0,
        'timestamp': Date.now(),
        'type': data.type,
        'message': data.message,
        'latitude': userDataService.getLatitude(),
        'longitude': userDataService.getLongitude(),
        'user': {
          'user_id': userDataService.getId(),
          'display_name': userDataService.getDisplayName(),
          'team': userDataService.getTeam(),
          'is_me': true
        }
      });
      $timeout(function () {
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollBottom(true);
      });
    }

    /*
     * Scope Functions
     */

    $scope.$on('$ionicView.afterEnter', function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollBottom(true);
      });
    });

    $scope.inputUp = function () {
      if (isIOS) $scope.data.keyboardHeight = 216;
      $timeout(function () {
        $ionicScrollDelegate.scrollBottom(true);
      }, 300);

    };

    $scope.inputDown = function () {
      if (isIOS) $scope.data.keyboardHeight = 0;
      $ionicScrollDelegate.resize();
    };

    $scope.sendMessage = function () {
      // TODO: Add front-end and back-end validation+

      var message = $scope.data.message;
      $scope.data.message = '';

      addLocalMessageToScope({
        'type': 'message',
        'message': message
      });

      var data = {
        'user': {
          'user_id': userDataService.getId(),
          'display_name': userDataService.getDisplayName(),
          'team': userDataService.getTeam()
        },
        'timestamp': firebase.database.ServerValue.TIMESTAMP,
        'message': message
      };
      sendPublicMessageWithData(data);
    };

    $scope.showSendLocationPopup = function () {
      var popup = $ionicPopup.confirm({title: 'Show Location', template: 'Are you sure you want to share your location? Your precise location will be sent to all chat participants.'});

      popup.then(function (confirmed) {
        if (confirmed) {
          $cordovaGeolocation
            .getCurrentPosition({timeout: 10000, enableHighAccuracy: true})
            .then(function (position) {
              // Set coordinates
              userDataService.setCoordinates([position.coords.latitude, position.coords.longitude]);

              addLocalMessageToScope({'type': 'location'});

              var data = {
                'user': {
                  'user_id': userDataService.getId(),
                  'display_name': userDataService.getDisplayName(),
                  'team': userDataService.getTeam()
                },
                'timestamp': firebase.database.ServerValue.TIMESTAMP,
                'latitude': userDataService.getLatitude(),
                'longitude': userDataService.getLongitude()
              };
              sendPublicMessageWithData(data);

            }, function (error) {
              $ionicPopup.alert('Unable to retrieve location', 'Your message was not sent. Ensure location services are enabled and try again.', 4000);
            });
        }
      });
    };

    /*
     * Runtime Functions
     */

    // Get the initial coordinates and start listening for messages
    $cordovaGeolocation
      .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
      .then(function (position) {
        // Set coordinates
        userDataService.setCoordinates([position.coords.latitude, position.coords.longitude]);
        listenForGeoQueryMessages();
      }, function (error) {
        $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve location. Ensure location services are enabled and restart app.'});
      });
  });
