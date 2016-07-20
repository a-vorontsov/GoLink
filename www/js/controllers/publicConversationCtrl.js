angular.module('app.controllers')
  .controller('publicConversationCtrl', function ($scope, $timeout, $cordovaGeolocation, $ionicActionSheet, $ionicScrollDelegate, $ionicPopup, userDataService, uuid) {
    $scope.isLoading = true;

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      // Check whether the radius has been changed in settings
      if (typeof(currentRadius) !== 'undefined' && (isGeoQueryInitialized && currentRadius !== userDataService.getRadius())) {
        $scope.isLoading = true;
        geoQuery.cancel();
        $scope.messages = [];
        startGeoQuery();
      }
    });

    $scope.data = {'message': ''};
    $scope.messages = [];

    var geoQuery;
    var isGeoQueryInitialized = false;
    var currentRadius;
    var sentMessageKeys = [];
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    var geoFire = new GeoFire(firebase.database().ref('public_message_locations'));

    /*
     * Helper Functions
     */

    function startGeoQuery() {
      currentRadius = userDataService.getRadius();
      geoQuery = geoFire.query({
        center: [userDataService.getLatitude(), userDataService.getLongitude()],
        radius: userDataService.getRadius()
      });

      geoQuery.on("ready", function () {
        isGeoQueryInitialized = true;
        $scope.isLoading = false;
        $ionicScrollDelegate.scrollBottom(true);
      });

      geoQuery.on("key_entered", function (key, location, distance) {
        if (sentMessageKeys.indexOf(key) === -1) {
          transferGeoQueryResultFromFirebaseToScope(key, location, distance);
        }
      });

      geoQuery.on("key_exited", function (key, location, distance) {
        var messages = $scope.messages;
        for (var i = messages.length - 1; i >= 0; i--) {
          var message = messages[i];
          if (message.key === key) {
            $scope.messages.splice(i, 1);
            $timeout(function () {
              $ionicScrollDelegate.resize();
            });
          }
        }
      });
    }

    function isUserIdInBlockList(userId) {
      var blockList = userDataService.getBlockList();
      for (var i = 0; i < blockList.length; i++) {
        var blockListUser = blockList[i];
        if (blockListUser.user_id === userId) {
          return true;
        }
      }
      return false;
    }

    function sortScopeMessagesByTimestamp() {
      $timeout(function () {
        $scope.messages.sort(function (x, y) {
          return x.timestamp - y.timestamp;
        });
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollBottom(true);
      });
    }

    function transferGeoQueryResultFromFirebaseToScope(key, location, distance) {
      firebase.database().ref('/public_messages/' + key).once('value').then(function (snapshot) {
        if (snapshot.exists() && snapshot.hasChild('timestamp') && snapshot.hasChild('user') && snapshot.hasChild('uuid')) {
          var messageSnapshot = snapshot.val();
          $scope.messages.push({
            'key': key,
            'uuid': messageSnapshot.uuid,
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
            },
            'is_hidden': isUserIdInBlockList(messageSnapshot.user.user_id)
          });
          sortScopeMessagesByTimestamp();
        }
      }, function (error) {
        if (!error.message.indexOf('permission_denied') > 1) {
          throw error;
        }
      });
    }

    function sendConversationMessageWithData(data) {
      // Create a message
      var newMessageRef = firebase.database().ref('public_messages').push();
      sentMessageKeys.push(newMessageRef.key);

      var messages = $scope.messages;
      for (var i = messages.length - 1; i >= 0; i--) {
        var message = messages[i];
        if (message.uuid === data.uuid && message.key === '') {
          message.key = newMessageRef.key;
          $scope.messages[i] = message;
          $timeout(function () {
            $ionicScrollDelegate.resize();
          });
          break;
        }
      }

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
        'uuid': data.uuid,
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

    $scope.$on('$ionicView.afterEnter', function () {
      $timeout(function () {
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
      // TODO: Add front-end and back-end validation

      var message = $scope.data.message;
      $scope.data.message = '';
      var identifier = uuid.v4();

      addLocalMessageToScope({
        'uuid': identifier,
        'type': 'message',
        'message': message
      });

      var data = {
        'uuid': identifier,
        'user': {
          'user_id': userDataService.getId(),
          'display_name': userDataService.getDisplayName(),
          'team': userDataService.getTeam()
        },
        'timestamp': firebase.database.ServerValue.TIMESTAMP,
        'message': message
      };
      sendConversationMessageWithData(data);
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

              var identifier = uuid.v4();
              addLocalMessageToScope({'uuid': identifier, 'type': 'location'});

              var data = {
                'uuid': identifier,
                'user': {
                  'user_id': userDataService.getId(),
                  'display_name': userDataService.getDisplayName(),
                  'team': userDataService.getTeam()
                },
                'timestamp': firebase.database.ServerValue.TIMESTAMP,
                'latitude': userDataService.getLatitude(),
                'longitude': userDataService.getLongitude()
              };
              sendConversationMessageWithData(data);

            }, function (error) {
              $ionicPopup.alert('Unable to retrieve location', 'Your message was not sent. Ensure location services are enabled and try again.');
            });
        }
      });
    };

    $scope.onMessageClicked = function (message, isMe) {
      if (isMe) {
        $ionicActionSheet.show({
          destructiveText: 'Delete',
          destructiveButtonClicked: function () {
            if (typeof(message.key) === 'undefined' || message.key === null) {
              $ionicPopup.show({title: 'Unable to delete', template: 'The message cannot be deleted at this time as it is still being sent to the server.'})
            } else {
              geoFire.remove(message.key);
              var scopeMessages = $scope.messages;
              for (var i = scopeMessages.length - 1; i >= 0; i--) {
                var scopeMessage = scopeMessages[i];
                if (scopeMessage.key === message.key) {
                  $scope.messages.splice(i, 1);
                  $timeout(function () {
                    $ionicScrollDelegate.resize();
                  });
                  break;
                }
              }
            }
            return true;
          }
        });
      } else {
        $ionicActionSheet.show({
          destructiveText: 'Block',
          destructiveButtonClicked: function () {
            $ionicPopup.confirm({title: 'Block user?', template: 'Are you sure you want to block the user? You can unblock them on your settings page.'})
              .then(function (confirmed) {
                if (!confirmed) {
                  return true;
                }

                $ionicLoading.show();
                firebase().database.ref('block_list/' + userDataService.getId() + '/' + message.user.user_id).set({
                  'display_name': message.user.display_name,
                  'blocked_at': firebase.database.ServerValue.TIMESTAMP
                }, function (error) {
                  if (error) {
                    $ionicLoading.hide();
                    $ionicPopup.show({title: 'Unable to block user', template: 'The user could not be blocked. Check your internet connection and try again.'});
                    return;
                  }

                  var blockList = userDataService.getBlockList();
                  blockList.push({'user_id': message.user.user_id, 'display_name': message.user.display_name, 'blocked_at': Date.now()});
                  userDataService.setBlockList(blockList);

                  // Loop through all messages, hiding where the user ID is on the block list
                  var scopeMessages = $scope.messages;
                  for (var i = scopeMessages.length - 1; i >= 0; i--) {
                    var scopeMessage = scopeMessages[i];
                    if (scopeMessage.user.user_id === message.user.user_id) {
                      scopeMessage.is_hidden = true;
                      $scope.messages[i] = scopeMessage;
                      $timeout(function () {
                        $ionicScrollDelegate.resize();
                      });
                    }
                  }
                  $ionicLoading.hide();
                });

                return true;
              });
          }
        });
      }
    };

    /*
     * Runtime
     */

    startGeoQuery();

  });
