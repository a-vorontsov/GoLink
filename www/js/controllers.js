// TODO: Check user authentication state
angular.module('app.controllers', [])

  .controller('splashCtrl', function ($scope, $state, $ionicHistory, userDataService) {
    // Disable animation on transition
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });

    // Check authentication state and move to the appropriate page
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // Update user data service
        userDataService.setId(user.uid);
        // Check whether the user has gone through the setup process
        firebase.database().ref('/members/' + user.uid).once('value').then(function (snapshot) {
          if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('team')) {
            // Update user data service
            var memberSnapshot = snapshot.val();
            userDataService.setDisplayName(memberSnapshot.display_name);
            userDataService.setTeam(memberSnapshot.team);
            // Navigate to the main tab view
            $state.go('tabsController.publicMessages');
          } else {
            $state.go('setup');
          }
        }, function (error) {
          // TODO: Toast
          console.log(error);
        });
      } else {
        $state.go('login');
      }
    });
  })

  .controller('loginCtrl', function ($scope, $state, ionicToast) {
    $scope.data = {};

    $scope.login = function () {
      // TODO: Validation on both front-end and back-end

      var email = $scope.data.email;
      var password = $scope.data.password;

      firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
        // TODO: Fix ionicToast not working
        ionicToast.show('Login successful. Welcome back!', 'bottom', false, 2000);
        $state.go('splash');

      }).catch(function (error) {
        var errorCode = error.code;
        if (errorCode === "user/disabled") {
          ionicToast.show('Your account has been disabled. Contact support for more info.', 'bottom', false);
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
          $state.go('tabsController.publicMessages');
        }
      });
    }
  })

  .controller('forgotPasswordCtrl', function ($scope) {

  })

  .controller('publicMessagesCtrl', function ($scope, $timeout, $cordovaGeolocation, $ionicScrollDelegate, $ionicPopup, ionicToast, userDataService) {
    // TODO: Add a loading spinner

    $scope.data = {'message': ''};
    $scope.messages = [];

    var sentMessageKeys = [];
    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
    var geoFire = new GeoFire(firebase.database().ref('public_message_locations'));

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
        if (error) {
          console.log(error);
        } else {
          // Set the GeoFire instance of the message
          geoFire.set(newMessageRef.key, [userDataService.getFuzzyLatitude(), userDataService.getFuzzyLongitude()]).then(function () {
          }, function (error) {
            console.log(error);
          });
        }
      });
    }

    // Get the initial coordinates and start listening for messages
    $cordovaGeolocation
      .getCurrentPosition({timeout: 10000, enableHighAccuracy: false})
      .then(function (position) {
        // Set coordinates
        userDataService.setCoordinates([position.coords.latitude, position.coords.longitude]);
        listenForGeoQueryMessages();
      }, function (error) {
        console.log(error);
        ionicToast.show('Unable to retrieve location. Restart app.', 'bottom', false);
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

      $scope.messages.push({
        'key': '',
        'distance': 0,
        'timestamp': Date.now(),
        'type': 'message',
        'message': message,
        'longitude': userDataService.getFuzzyLongitude(),
        'latitude': userDataService.getFuzzyLatitude(),
        'user': {
          'user_id': userDataService.getId(),
          'display_name': userDataService.getDisplayName(),
          'team': userDataService.getTeam(),
          'is_me': true
        }
      });
      $ionicScrollDelegate.scrollBottom(true);

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

    function sendPreciseLocation() {
      $cordovaGeolocation
        .getCurrentPosition({timeout: 10000, enableHighAccuracy: true})
        .then(function (position) {
          // Set coordinates
          userDataService.setCoordinates([position.coords.latitude, position.coords.longitude]);

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

    $scope.showSendLocationPopup = function () {
      var popup = $ionicPopup.confirm({
        title: 'Show Location',
        template: 'Are you sure you want to share your location? Your precise location will be sent to all chat participants.'
      });

      popup.then(function (confirmed) {
        if (confirmed) {
          sendPreciseLocation();
        }
      });
    }
  })

  .controller('friendsCtrl', function ($scope) {

  })

  .controller('pokedexCtrl', function ($scope) {

  })

  .controller('profileCtrl', function ($scope, $state, ionicToast) {
    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        ionicToast.show('You have been signed out.', 'bottom', false);
        $state.go('splash');
      }).catch(function (error) {
        ionicToast.show('Unable to sign out. Contact support with code: ' + error.code, 'bottom', false);
      })
    }
  })

  .controller('conversationCtrl', function ($scope) {

  });
