// TODO: Check user authentication state
angular.module('app.controllers', [])

  .controller('splashCtrl', function ($scope, $state, $ionicHistory) {
    // Disable animation on transition
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });

    // Check authentication state and move to the appropriate page
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // Check whether the user has gone through the setup process
        firebase.database().ref('/members/' + user.uid).once('value').then(function (snapshot) {
          if (snapshot.exists() && snapshot.hasChild('display_name') && snapshot.hasChild('team')) {
            $state.go('tabsController.publicMessages');
          } else {
            $state.go('setup');
          }
        }, function (error) {
          // TODO: Toast
          console.log('asdf');
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

  .controller('publicMessagesCtrl', function ($scope, $cordovaGeolocation, ionicToast) {
    $scope.data = {'message': ''};
    var user = firebase.auth().currentUser;
    var lat;
    var long;

    // Get the initial coordinates
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        var fuzzyAccuracy = 2;
        lat = +position.coords.latitude.toFixed(2);
        long = +position.coords.longitude.toFixed(2);
        console.log(lat, long);
      }, function (error) {
        console.log(error);
        ionicToast.show('Unable to retrieve location. Restart app.', 'bottom', false);
      });


    // TODO: Add loading spinner
    $scope.sendMessage = function () {



      // TODO: Add front-end and back-end validation
      firebase.database().ref('public_messages').push({
        'user_id': user.uid,
        'timestamp': Firebase.ServerValue.TIMESTAMP,
        'message': $scope.data.message,

      })

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
