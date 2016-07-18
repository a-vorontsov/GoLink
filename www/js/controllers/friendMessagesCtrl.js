angular.module('app.controllers')
  .controller('friendMessagesCtrl', function ($scope, $stateParams, $ionicScrollDelegate, $ionicNavBarDelegate, $ionicPopup, $cordovaGeolocation, $timeout, ERROR_TYPE, userDataService, helperService) {
    $ionicNavBarDelegate.showBackButton(true);
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

      addLocalMessageToScope({
        'type': 'message',
        'message': message
      });

      var data = {
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

              addLocalMessageToScope({'type': 'location'});

              var data = {
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
      var userId = userDataService.getId();
      for (var key in messages) {
        var message = messages[key];
        message.type = $scope.data.messages.push({
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
      listenForNewMessages();
      $timeout(function () {
        $scope.isLoading = false;
      });
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
