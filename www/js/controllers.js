angular.module('app.controllers', [])

  .controller('splashCtrl', function ($scope, $state, $ionicHistory) {
    // Disable animation on transition
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });

    // Check authentication state and move to the appropriate page
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // TODO: Check if user has a member with required fields filled out
        $state.go('tabsController.nearMe');
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

  .controller('setupCtrl', function ($scope) {

  })

  .controller('forgotPasswordCtrl', function ($scope) {

  })

  .controller('nearMeCtrl', function ($scope) {

  })

  .controller('conversationsCtrl', function ($scope) {

  })

  .controller('friendsCtrl', function ($scope) {

  })

  .controller('pokedexCtrl', function ($scope) {

  })

  .controller('profileCtrl', function ($scope, $state, ionicToast) {
    $scope.signOut = function () {
      firebase.auth().signOut().then(function() {
        ionicToast.show('You have been signed out.', 'bottom', false);
        $state.go('splash');
      }).catch(function(error) {
        ionicToast.show('Unable to sign out. Contact support with code: ' + error.code, 'bottom', false);
      })
    }
  })

  .controller('conversationCtrl', function ($scope) {

  });
