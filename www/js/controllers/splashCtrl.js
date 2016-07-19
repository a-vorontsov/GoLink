angular.module('app.controllers')
  .controller('splashCtrl', function ($scope, $state, $window, $ionicHistory, $ionicNavBarDelegate, $ionicPopup, CONFIG_VARS, userDataService) {
    // Disable animation on transition
    $ionicNavBarDelegate.showBackButton(false);

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
              // User is configured

              // Update user data service
              var memberSnapshot = snapshot.val();
              userDataService.setDisplayName(memberSnapshot.display_name);
              userDataService.setTeam(memberSnapshot.team);
              userDataService.setRadius(memberSnapshot.radius);
              userDataService.setFriendCode(memberSnapshot.friend_code);

              // Navigate to the main tab view
              $state.go('tabsController.publicConversation');

            } else if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('radius') && snapshot.hasChild('team')) {
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

            } else {
              // User is not configured at all
              $state.go('setup');
            }

          }, function (error) {
            $ionicPopup.alert({title: "Error", template: "Unable to retrieve your user details. Check your internet connection and restart the app."});
            $ionicPopup.alert({title: "Error", template: "Unable to retrieve your user details. Check your internet connection and restart the app."});
          });

        } else {
          $state.go('login');
        }
      });
    }

    checkUser();
  });
