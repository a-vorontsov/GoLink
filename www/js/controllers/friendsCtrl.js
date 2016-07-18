angular.module('app.controllers')
  .controller('friendsCtrl', function ($scope, $ionicPopup, $ionicLoading, $ionicHistory, $ionicNavBarDelegate, $sanitize, $timeout, ERROR_TYPE, userDataService, helperService) {
    $ionicHistory.nextViewOptions({
      disableAnimate: false
    });
    $ionicNavBarDelegate.showBackButton(true);

    // TODO: Timeout for last messaged
    $scope.isLoading = true;
    $scope.data = {
      'friendCode': userDataService.getFriendCode(),
      'targetFriendCode': '',
      'friends': []
    };

    /*
     * General helper functions
     */

    function showIonicLoading() {
      return $ionicLoading.show({
        template: '<ion-spinner></ion-spinner><br />Loading...'
      });
    }

    function sortScopeDataFriends() {
      $scope.data.friends.sort(function (x, y) {
        if (x < y) {
          return -1;
        } else if (x > y) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    function hideIonicLoadingWithTitleTemplate(title, template) {
      $ionicLoading.hide().then(function () {
        $ionicPopup.alert({
          title: title,
          template: template
        });
      });
    }

    function hideIonicLoadingWithInternetError() {
      hideIonicLoadingWithTitleTemplate('Error', 'An error occurred. Check your internet connection and try again.');
    }

    /*
     * Adding friends
     */

    // Temporary variables
    var friendUserId;
    var friendMemberObject;
    var lastMessagedListenerPromises = [];

    function addFriendByFriendCode(targetFriendCode) {
      // Show loading screen
      showIonicLoading().then(function onLoadingScreenShow() {
        // Retrieve the user ID of the friend code
        return firebase.database().ref('/friend_codes/' + targetFriendCode).once('value');

      }).then(function getMemberDetailsFromFriendCodeSnapshot(snapshot) {
        // Check whether the user ID for this snapshot exists
        if (!(snapshot.exists() && snapshot.hasChild('user_id'))) {
          return Promise.reject(ERROR_TYPE.USER_NOT_FOUND);
        }

        // Retrieve the member details for the user ID
        friendUserId = snapshot.child('user_id').val();
        if (friendUserId == userDataService.getId()) {
          return Promise.reject(ERROR_TYPE.DB_INTEGRITY);
        }

        for (var i = 0; i < $scope.data.friends.length; i++) {
          var friend = $scope.data.friends[i];
          if (friendUserId == friend.user_id) {
            return Promise.reject(ERROR_TYPE.FRIEND_ALREADY_ADDED);
          }
        }

        return firebase.database().ref('/members/' + friendUserId).once('value');

      }).then(function getFriendMemberSnapshot(snapshot) {
        // Check whether the display name exists for this snapshot
        if (!(snapshot.exists() && snapshot.hasChild('display_name'))) {
          return Promise.reject(ERROR_TYPE.DB_INTEGRITY);
        }

        friendMemberObject = snapshot.val();
        return $ionicLoading.hide();

      }).then(function displayConfirmationScreen() {
        return $ionicPopup.confirm({
          title: 'Add friend?',
          template: 'Do you want to add <b>' + $sanitize(friendMemberObject.display_name) + '</b> as a friend?',
          cancelText: 'No',
          okText: 'Yes'
        });

      }).then(function onConfirmationScreenResult(result) {
        if (!result) {
          return Promise.reject(ERROR_TYPE.NONE);
        }

        return showIonicLoading();

      }).then(function onIonicLoadingShown() {
        return firebase.database().ref('members/' + userDataService.getId() + '/friends/' + friendUserId).set({'added_at': firebase.database.ServerValue.TIMESTAMP});
      }).then(function onGetFriendInfo(error) {
        if (error) {
          return Promise.reject(ERROR_TYPE.INET);
        }
        $scope.data.friends.push({
          'user_id': friendUserId,
          'display_name': friendMemberObject.display_name,
          'team': friendMemberObject.team,
          'last_messaged': null,
          'added_at': Date.now()
        });
        sortScopeDataFriends();
        hideIonicLoadingWithTitleTemplate('Success!', '<b>' + $sanitize(friendMemberObject.display_name) + '</b> has been added to your friends list.');
      }, function (error) {
        if (error === ERROR_TYPE.NONE) {
        } else if (error === ERROR_TYPE.INET) {
          hideIonicLoadingWithInternetError();
        } else if (error === ERROR_TYPE.DB_INTEGRITY) {
          hideIonicLoadingWithTitleTemplate('Database integrity error', 'This shouldn\'t happen. Please email us with the friend code you entered ASAP!')
        } else if (error === ERROR_TYPE.USER_NOT_FOUND) {
          hideIonicLoadingWithTitleTemplate('User not found', 'The friend code you entered is not tied to a user.');
        } else if (error === ERROR_TYPE.FRIEND_ALREADY_ADDED) {
          hideIonicLoadingWithTitleTemplate('Friend already added', 'This person is already in your friends list.');
        } else {
          hideIonicLoadingWithInternetError();
        }
      });
    }

    $scope.showAddFriendPopup = function () {
      $ionicPopup.show({
        template: '<input type="text" ng-model="data.targetFriendCode">',
        title: 'Enter friend code',
        subTitle: 'Enter a 12-digit friend code without hyphens (-) below.',
        scope: $scope,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data.targetFriendCode
                || $scope.data.targetFriendCode.length !== 12
                || !$scope.data.targetFriendCode.match(/^[0-9]+$/)) {
                $ionicPopup.alert({title: 'Error', template: 'Enter a valid 12-digit friend code.'});
                e.preventDefault();
              } else if (userDataService.getFriendCode() === $scope.data.targetFriendCode) {
                $ionicPopup.alert({title: 'Error', template: 'You can\'t add yourself, you numpty.'});
                e.preventDefault();
              } else {
                // Code passes validation check
                addFriendByFriendCode($scope.data.targetFriendCode);
                $scope.data.targetFriendCode = '';

              }
            }
          }
        ]
      });
    };

    /*
     * Getting list of friends
     */

    function getFriendObjectPromise(friendId) {
      return firebase.database().ref('members/' + friendId).once('value').then(function (snapshot) {
        var friend = snapshot.val();
        friend.user_id = friendId;
        return friend;
      });
    }

    function getLastMessagedSnapshotPromise(conversationId) {
      return firebase.database().ref('friend_conversations/' + conversationId + '/last_messaged').once('value').then(function (snapshot) {
        return snapshot;
      });
    }

    firebase.database().ref('members/' + userDataService.getId() + '/friends').once('value').then(function (snapshot) {
      // Add initial list of friends to array and get further information about each friend
      var friends = snapshot.val();
      var getFriendObjectPromises = [];
      var getLastMessagedPromises = [];
      for (var friendUserId in friends) {
        var friend = friends[friendUserId];
        $scope.data.friends.push({'user_id': friendUserId, 'added_at': friend.added_at});
        getFriendObjectPromises.push(getFriendObjectPromise(friendUserId));
        getLastMessagedPromises.push(getLastMessagedSnapshotPromise(helperService.getConversationId(userDataService.getId(), friendUserId)));
        // lastMessagedListenerPromises.push(getFriendTimestampListenerPromise(helperService.getConversationId(userDataService.getId(), friendUserId)))
      }

      // Execute all promises
      Promise.all(getFriendObjectPromises).then(function onGetFriendObjectPromisesComplete(results) {
        results.forEach(function (result) {
          for (var i = 0; i < $scope.data.friends.length; i++) {
            if ($scope.data.friends[i].user_id === result.user_id) {
              $scope.data.friends[i].display_name = result.display_name;
              $scope.data.friends[i].friend_code = result.friend_code;
              $scope.data.friends[i].team = result.team;
              break;
            }
          }
        });

        return Promise.all(getLastMessagedPromises);
      }).then(function onGetLastMessagedPromisesComplete(results) {
        results.forEach(function (result) {
          // Listen for timestamp updates
          firebase.database().ref('friend_conversations/' + result.ref.parent.key + '/last_messaged').on('value', function (snapshot) {
            var friendId = helperService.getFriendUserIdFromConversationId(userDataService.getId(), snapshot.ref.parent.key);
            var lastMessaged = snapshot.val();
            for (var i = 0; i < $scope.data.friends.length; i++) {
              if ($scope.data.friends[i].user_id === friendId) {
                $timeout(function () {
                  if (typeof(lastMessaged) === undefined || lastMessaged === null) {
                    $scope.data.friends[i].last_messaged = null;
                  } else {
                    $scope.data.friends[i].last_messaged = lastMessaged;
                  }
                });
                break;
              }
            }
          });
        });

        $timeout(function () {
          userDataService.setFriends($scope.data.friends);
          $scope.isLoading = false;
        });
      }, function (error) {
        $ionicPopup.alert('Error', 'Unable to retrieve friends. Check your internet connection and restart the app.');
      });

    }, function (error) {
      if (error) {
        $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve friends. Check your internet connection and restart the app.'});
      }
    });

  });
