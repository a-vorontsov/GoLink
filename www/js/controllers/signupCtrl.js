angular.module('app.controllers')
  .controller('signupCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    $scope.data = {};

    $scope.signUp = function () {
      var email = $scope.data.email;
      var password = $scope.data.password;

      if (typeof(email) === 'undefined' || (email.length < 1 || password.length < 1)) {
        $ionicPopup.alert({title: "Registration failed", template: "The credentials you entered are in an invalid format."});
        return;
      }

      $ionicLoading.show();
      firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
        $scope.data.email = '';
        $scope.data.password = '';
        $ionicLoading.hide();
        $state.go('splash');
      }).catch(function (error) {
        $ionicLoading.hide();
        var errorCode = error.code;
        if (errorCode === "auth/email-already-in-use") {
          $ionicPopup.alert({title: 'Registration failed', template: 'The email you entered is already in use.'});
        } else if (errorCode === "auth/invalid-email") {
          $ionicPopup.alert({title: 'Registration failed', template: 'The email you entered is not in a valid format.'});
        } else if (errorCode === "auth/weak-password") {
          $ionicPopup.alert({title: 'Registration failed', template: 'Your password is not strong enough.'});
        } else if (errorCode === "auth/network-request-failed") {
          $ionicPopup.alert({title: 'Registration failed', template: 'Failed to connect to the server. Check your internet connection and try again.'});
        } else {
          $ionicPopup.alert('Registration failed', 'Contact support with the error code: ' + errorCode);
        }
      });
    };
  })
