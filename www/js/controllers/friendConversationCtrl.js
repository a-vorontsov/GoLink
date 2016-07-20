angular.module('app.controllers')
  .controller('friendConversation', function ($scope, $stateParams, $ionicScrollDelegate, $ionicActionSheet, $ionicNavBarDelegate, $ionicPopup, $cordovaGeolocation, $timeout, ERROR_TYPE, userDataService, helperService) {

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      viewData.enableBack = true;
    });

    $scope.data = {
      'messages': [],
      'friend': {
        'user_id': friendId,
        'added_at': null
      }
    };
    var friendId = $stateParams.friendId;
    var conversationId = helperService.getConversationId(userDataService.getId(), friendId);
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    var sentMessageKeys = [];
    var userId = userDataService.getId();
    $scope.isLoading = true;
    $scope.isInFriendsList = false;
    $scope.isConnectedToFriend = true;

    function sendConversationMessageWithData(data) {
      // Create a message
      var newMessageRef = firebase.database().ref('friend_conversations/' + conversationId + '/messages').push();
      sentMessageKeys.push(newMessageRef.key);

      // Set the message
      var updatedMessageData = {};
      updatedMessageData[conversationId + '/messages/' + newMessageRef.key] = data;
      updatedMessageData[conversationId + '/last_messaged'] = firebase.database.ServerValue.TIMESTAMP;
      firebase.database().ref('friend_conversations').update(updatedMessageData);
    }

    function addLocalMessageToScope(data) {
      $scope.data.messages.push({
        'uuid': data.uuid,
        'key': '',
        'distance': 0,
        'timestamp': Date.now(),
        'type': data.type,
        'message': data.message,
        'latitude': userDataService.getLatitude(),
        'longitude': userDataService.getLongitude(),
        'is_me': true
      });
      $ionicScrollDelegate.scrollBottom(true);
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
        'user_id': userDataService.getId(),
        'timestamp': firebase.database.ServerValue.TIMESTAMP,
        'message': message
      };
      sendConversationMessageWithData(data);
    };

    $scope.showSendLocationPopup = function () {
      var popup = $ionicPopup.confirm({
        title: 'Show Location',
        template: 'Are you sure you want to share your location? Your precise location will be sent to all chat participants.'
      });

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
                'user_id': userDataService.getId(),
                'timestamp': firebase.database.ServerValue.TIMESTAMP,
                'latitude': userDataService.getLatitude(),
                'longitude': userDataService.getLongitude()
              };
              sendConversationMessageWithData(data);

            }, function (error) {
              $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve location. Your message was not sent. Ensure location retrieval is enabled and try again.'});
            });
        }
      });
    };

    $scope.onMessageClicked = function (message, isMe) {
      // TODO: Solve the issue where a message sent by the user does not have a key
      if (isMe) {
        $ionicActionSheet.show({
          destructiveText: 'Delete',
          destructiveButtonClicked: function () {
            if (typeof(message.key) === 'undefined' || message.key === null) {
              $ionicPopup.show({title: 'Unable to delete', template: 'The message cannot be deleted at this time as it is still being sent to the server.'})
            } else {
              firebase.database().ref('friend_conversations/' + conversationId + '/messages/' + message.key).remove();
              // TODO: Create a separate directive for message contains, which, when deleted, fades to class = hide
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

                // TODO: Add user to block list
                // Loop through all messages, hiding where the user ID is on the block list

                return true;
              });
          }
        });
      }

    };

    $scope.onSideButtonClicked = function () {
      // TODO: Handle race condition where friend ID is not populated yet
      $ionicActionSheet.show({
        titleText: '{{data.friend.display_name}} - Team {{data.friend.team}}<br />Added on ', // TODO: Timestamp
        destructiveText: 'Remove',
        destructiveButtonClicked: function () {
          $ionicPopup.confirm({title: 'Remove friend?', template: 'Are you sure you want to remove this friend? You will need their friend code in order to add them again.'})
            .then(function (confirmed) {
              if (!confirmed) {
                return true;
              }

              firebase.database().ref('members/' + userDataService.getId() + '/friends/' + friendId).remove();
              // TODO: Create a function handler where, on error, shows a popup
              // If completed successfully, tell the user that their friend has been removed from their friends list and $state.go('friends'), removing the friend from the back stack

              return true;
            });
        }
      });
    }

    /*
     * Runtime
     */

    function listenForNewMessages() {
      var promise;
      if ($scope.data.messages.length > 0) {
        promise = firebase.database().ref('friend_conversations/' + conversationId + '/messages').orderByKey().startAt($scope.data.messages[$scope.data.messages.length - 1].key);
      } else {
        promise = firebase.database().ref('friend_conversations/' + conversationId + '/messages').orderByKey();
      }

      promise.on("child_added", function (snapshot) {
        var message = snapshot.val();
        if (sentMessageKeys.indexOf(snapshot.key) === -1) {
          $timeout(function () {
            $scope.data.messages.push({
              'key': snapshot.key,
              'timestamp': message.timestamp,
              'type': typeof(message.longitude) === 'undefined' ? 'message' : 'location',
              'message': message.message,
              'longitude': message.longitude,
              'latitude': message.latitude,
              'user_id': message.user_id,
              'is_me': message.user_id === userId
            });
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollBottom(true);
          });
        }
      });

      promise.on("child_removed", function (oldSnapshot) {
        var key = snapshot.key;

        var messages = $scope.data.messages;
        for (var i = 0; i < messages.length; i++) {
          var message = messages[i];
          if (message.key === key) {
            $scope.data.messages.splice(index, 1);
            $timeout(function () {
              $ionicScrollDelegate.resize();
            });
          }
        }
      });
    }

    // Check whether the friend is in the friends list
    var friends = userDataService.getFriends();
    for (var i = 0; i < friends.length; i++) {
      var friend = friends[i];
      if (friendId == friend.user_id) {
        $scope.isInFriendsList = true;
        $scope.data.friend.display_name = friend.display_name;
        $scope.data.friend.team = friend.team;
        break;
      }
    }

    if (!$scope.isInFriendsList) {
      $scope.isLoading = false;
      return;
    }

    // Check whether the friend is connected to the user
    firebase.database().ref('members/' + friendId + '/friends/' + userDataService.getId()).once('value').then(function (snapshot) {
      if (!(snapshot.exists() && snapshot.hasChild('added_at'))) {
        return Promise.reject(ERROR_TYPE.FRIEND_NOT_ADDED);
      }
      $scope.data.friend.added_at = snapshot.child('added_at').val();

      return firebase.database().ref('friend_conversations/' + conversationId + '/messages').once('value');
    }).then(function (snapshot) {
      // Populate the list of messages
      var messages = snapshot.val();
      for (var key in messages) {
        var message = messages[key];
        $scope.data.messages.push({
          'key': key,
          'timestamp': message.timestamp,
          'type': typeof(message.longitude) === 'undefined' ? 'message' : 'location',
          'message': message.message,
          'longitude': message.longitude,
          'latitude': message.latitude,
          'user_id': message.user_id,
          'is_me': message.user_id === userId
        });
      }
      $timeout(function () {
        $ionicScrollDelegate.resize();
        $scope.isLoading = false;
        $ionicScrollDelegate.scrollBottom(true);
      });
      listenForNewMessages();

    }, function (error) {
      return Promise.reject(error);
    }).catch(function (error) {
      $timeout(function () {
        if (error === ERROR_TYPE.FRIEND_NOT_ADDED) {
          $scope.isConnectedToFriend = false;
          $scope.isLoading = false;
          $scope.$apply();
        } else {
          $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve messages. Check your internet connection and restart the app.'});
        }
      })
    });

  });
