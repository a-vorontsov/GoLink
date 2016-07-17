// TODO: Check user authentication state
angular.module('app.controllers', [])

  .controller('splashCtrl', function ($scope, $state, $window, $ionicHistory, CONFIG_VARS, userDataService, ionicToast) {
    // Disable animation on transition
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });

    // Check authentication state and move to the appropriate page
    function checkUser() {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {

          // Update user data service
          userDataService.setId(user.uid);

          // Check whether the user has gone through the setup process
          firebase.database().ref('/members/' + user.uid).once('value').then(function (snapshot) {
            if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('team')
              && snapshot.hasChild('friend_code') && snapshot.child('friend_code').val().length === CONFIG_VARS.FRIEND_CODE_LENGTH) {
              // User is configured

              // Update user data service
              var memberSnapshot = snapshot.val();
              userDataService.setDisplayName(memberSnapshot.display_name);
              userDataService.setTeam(memberSnapshot.team);
              userDataService.setFriendCode(memberSnapshot.friend_code);

              // Navigate to the main tab view
              $state.go('tabsController.publicMessages');

            } else if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('team')) {
              // User is configured but does not have a friend code
              var attemptCounter = 0;

              function generateFriendCode() {
                var friendCode = '';
                for (var i = 0; i < 12; i++) {
                  friendCode += Math.floor(Math.random() * 10).toString();
                }
                return friendCode;
              }

              function insertFriendCode() {
                var friendCode = generateFriendCode();
                firebase.database().ref('friend_codes/' + friendCode).set({'user_id': userDataService.getId()}, function (error) {
                  if (error) {
                    console.log(error);
                    attemptCounter++;
                    if (attemptCounter < CONFIG_VARS.MAX_FRIEND_CODE_GENERATION_ATTEMPTS) {
                      insertFriendCode();
                    } else {
                      ionicToast.show('Unable to retrieve your friend code. Check your internet connection and restart the app.', 'bottom', false);
                    }
                  } else {
                    firebase.database().ref('members/' + userDataService.getId() + '/friend_code').set(friendCode, function (error) {
                      if (error) {
                        console.log(error);
                        attemptCounter++;
                        if (attemptCounter < CONFIG_VARS.MAX_FRIEND_CODE_GENERATION_ATTEMPTS) {
                          insertFriendCode();
                        } else {
                          ionicToast.show('Unable to retrieve your friend code. Check your internet connection and restart the app.', 'bottom', false);
                        }
                      } else {
                        checkUser();
                      }
                    });
                  }
                });
              }

              insertFriendCode();

            } else {
              // User is not configured at all
              $state.go('setup');
            }

          }, function (error) {
            // TODO: Toast
          });

        } else {
          $state.go('login');
        }
      });
    }

    checkUser();
  })

  .controller('loginCtrl', function ($scope, $state, ionicToast) {
    $scope.data = {};

    $scope.login = function () {
      // TODO: Validation on both front-end and back-end

      var email = $scope.data.email;
      var password = $scope.data.password;
      // TODO: Remove this error message
      $scope.error = "asdf";

      firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
        // TODO: Fix ionicToast not working
        $scope.data.email = '';
        $scope.data.password = '';
        ionicToast.show('Login successful. Welcome back!', 'bottom', false, 2000);
        $state.go('splash');

      }).catch(function (error) {
        var errorCode = error.code;
        $scope.error = JSON.stringify(error);
        if (errorCode === "auth/user-disabled") {
          ionicToast.show('Your account has been disabled. Contact support for more info.', 'bottom', false);
        } else if (errorCode === "auth/network-request-failed") {
          ionicToast.show('Unable to connect to the server. Check your internet connection and try again.', 'bottom', false);
        } else {
          ionicToast.show('The credentials you entered are invalid.', 'bottom', false);
        }
      });
    }
  })

  .controller('signupCtrl', function ($scope, $state, ionicToast) {
    $scope.data = {};

    $scope.signUp = function () {
      // TODO: Validation on both front-end and back-end

      var email = $scope.data.email;
      var password = $scope.data.password;

      firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
        $scope.data.email = '';
        $scope.data.password = '';
        ionicToast.show('Registration successful.', 'bottom', false, 2000);
        $state.go('splash');
      }).catch(function (error) {
        var errorCode = error.code;
        if (errorCode === "auth/email-already-in-use") {
          ionicToast.show('Signup failed. The email you entered is already in use.', 'bottom', false);
        } else if (errorCode === "auth/invalid-email") {
          ionicToast.show('Signup failed. The email you entered is not in a valid format.', 'bottom', false);
        } else if (errorCode === "auth/weak-password") {
          ionicToast.show('Signup failed. Your password is not strong enough.', 'bottom', false);
        } else if (errorCode === "auth/network-request-failed") {
          ionicToast.show('Unable to connect to the server. Check your internet connection and try again.', 'bottom', false);
        } else {
          ionicToast.show('Signup failed. Contact support with the error code: ' + errorCode, 'bottom', false);
        }
      });
    };
  })

  .controller('setupCtrl', function ($scope, $state, ionicToast) {
    $scope.data = {'displayName': '', 'team': 'Instinct'};
    $scope.sendSetup = function () {
      var displayName = $scope.data.displayName;
      var team = $scope.data.team;

      // TODO: Front-end and back-end validation
      var user = firebase.auth().currentUser;
      firebase.database().ref('members/' + user.uid).set({
        'display_name': displayName,
        'team': team
      }, function (error) {
        if (error) {
          console.log(error);
          ionicToast.show('Save failed. Try again later.', 'bottom', false);
        } else {
          ionicToast.show('Saved!', 'bottom', false);
          $state.go('splash');
        }
      });
    }
  })

  .controller('forgotPasswordCtrl', function ($scope) {

  })

  .controller('publicMessagesCtrl', function ($scope, $timeout, $cordovaGeolocation, $ionicScrollDelegate, $ionicPopup, ionicToast, userDataService) {
    $scope.isLoading = true;
    $timeout(function () {
      $scope.isLoading = false;
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
          $scope.messages.sort(function (x, y) {
            return x.timestamp - y.timestamp;
          });
          $ionicScrollDelegate.scrollBottom(true);
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
              console.log(error);
              ionicToast.show('Unable to retrieve location. Your message was not sent. Ensure location retrieval is enabled and try again.', 'bottom', false, 4000);
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
        ionicToast.show('Unable to retrieve location. Restart app.', 'bottom', false);
      });
  })

  .controller('friendsCtrl', function ($scope, $ionicPopup, $ionicLoading, $sanitize, ERROR_TYPE, userDataService, helperService, ionicToast) {
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
                ionicToast.show('Enter a valid 12-digit friend code.', 'bottom', false, 2500);
                e.preventDefault();
              } else if (userDataService.getFriendCode() === $scope.data.targetFriendCode) {
                ionicToast.show('You can\'t add yourself, you numpty.', 'bottom', false, 2500);
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
          var friendId = helperService.getFriendUserIdFromConversationId(userDataService.getId(), result.ref.parent.key);
          var lastMessaged = result.val();
          for (var i = 0; i < $scope.data.friends.length; i++) {
            if ($scope.data.friends[i].user_id === friendId) {
              if (typeof(lastMessaged) === undefined || lastMessaged === null) {
                $scope.data.friends[i].last_messaged = null;
              } else {
                $scope.data.friends[i].last_messaged = lastMessaged;
              }
              break;
            }
          }
        });
        $scope.isLoading = false;
      }, function (error) {
        ionicToast.show('Error: unable to retrieve friends. Check your internet connection and restart the app.', 'bottom', false, 4000);
      });

    }, function (error) {
      if (error) {
        ionicToast.show('Error: unable to retrieve friends. Check your internet connection and restart the app.', 'bottom', false, 4000);
      }
    });

  })

  .controller('pokedexCtrl', function ($scope) {

  })

  .controller('profileCtrl', function ($scope, $state, ionicToast) {
    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        ionicToast.show('You have been signed out.', 'bottom', false);
        $state.go('splash');
      }).catch(function (error) {
        ionicToast.show('Unable to sign out. Try again later or clear app data/reinstall the app.', 'bottom', false);
      })
    }
  })

  .controller('friendMessagesCtrl', function ($scope, $stateParams) {

  });
