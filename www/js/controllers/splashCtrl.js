angular.module('app.controllers')
  .controller('splashCtrl', function ($scope, $state, $window, $ionicHistory, $cordovaGeolocation, $ionicNavBarDelegate, $ionicPopup, CONFIG_VARS, userDataService) {
    // Disable animation on transition
    $ionicNavBarDelegate.showBackButton(false);

    function onUserConfigured(snapshot) {
      // Update user data service
      var memberSnapshot = snapshot.val();
      userDataService.setDisplayName(memberSnapshot.display_name);
      userDataService.setTeam(memberSnapshot.team);
      userDataService.setRadius(memberSnapshot.radius);
      userDataService.setFriendCode(memberSnapshot.friend_code);

      // Attempt to retrieve location
      $cordovaGeolocation
        .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
        .then(function (position) {
          // Set coordinates
          userDataService.setCoordinates([position.coords.latitude, position.coords.longitude]);

          // Attempt to retrieve block list
          firebase.database().ref('block_list/' + userDataService.getId()).once('value').then(function (snapshot) {
            var snapshotBlockList = snapshot.val();
            var blockList = [];
            for (var key in snapshotBlockList) {
              blockList.push({
                'user_id': key,
                'display_name': snapshotBlockList[key].display_name,
                'blocked_at': snapshotBlockList[key].blocked_at
              });
            }
            userDataService.setBlockList(blockList);

            // Navigate to the main tab view
            $state.go('tabsController.publicConversation');
          }, function(error) {
            $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve your user details. Check your internet connectivity and restart the app.'});
          });

        }, function (error) {
          $ionicPopup.alert({title: 'Error', template: 'Unable to retrieve location. Ensure location services are enabled and restart app.'});
        });
    }

    function onUserMissingFriendCode() {
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
            attemptCounter++;
            if (attemptCounter < CONFIG_VARS.MAX_FRIEND_CODE_GENERATION_ATTEMPTS) {
              insertFriendCode();
            } else {
              $ionicPopup.alert({title: "Error", template: "Unable to retrieve your friend code. Check your internet connection and restart the app."});
            }
          } else {
            firebase.database().ref('members/' + userDataService.getId() + '/friend_code').set(friendCode, function (error) {
              if (error) {
                attemptCounter++;
                if (attemptCounter < CONFIG_VARS.MAX_FRIEND_CODE_GENERATION_ATTEMPTS) {
                  insertFriendCode();
                } else {
                  $ionicPopup.alert({title: "Error", template: "Unable to retrieve your friend code. Check your internet connection and restart the app."});
                }
              } else {
                checkUser();
              }
            });
          }
        });
      }

      insertFriendCode();
    }

    // Check authentication state and move to the appropriate page
    function checkUser() {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {

          // Update user data service
          userDataService.setId(user.uid);

          // Check whether the user has gone through the setup process
          firebase.database().ref('/members/' + user.uid).once('value').then(function (snapshot) {
            if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')
              && snapshot.hasChild('friend_code') && snapshot.child('friend_code').val().length === CONFIG_VARS.FRIEND_CODE_LENGTH) {
              onUserConfigured(snapshot);
            } else if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')) {
              onUserMissingFriendCode();
            } else {
              $state.go('setup');
            }
          }, function (error) {
            $ionicPopup.alert({title: "Error", template: "Unable to retrieve your user details. Check your internet connection and restart the app."});
          });
        } else {
          $state.go('login');
        }
      });
    }

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      checkUser();
    });
  });
