angular.module('app.controllers', [])
  .controller('forgotPasswordCtrl', function ($scope, $ionicPopup, $ionicLoading) {
    // TODO: Add validation
    $scope.data = {email: ''};

    $scope.sendResetInstructions = function () {
      var auth = firebase.auth();
      var emailAddress = $scope.data.email;

      $ionicLoading.show();

      auth.sendPasswordResetEmail(emailAddress).then(function () {
        $ionicLoading.hide();
        $ionicPopup.alert({title: 'Email sent', template: 'Check your email address for the password reset email and follow the instructions from there.'});
        $scope.data.email = '';
      }, function (error) {
        $ionicLoading.hide();
        var errorCode = error.code;
        $scope.error = JSON.stringify(error);
        if (errorCode === "auth/invalid-email" || errorCode === "auth/user-not-found") {
          $ionicPopup.alert({title: 'Password reset failed', template: 'The email you entered is not tied to a user.'});
        } else if (errorCode === "auth/network-request-failed") {
          $ionicPopup.alert({title: 'Password reset failed', template: 'Unable to connect to the server. Check your internet connection and try again.'});
        } else {
          $ionicPopup.alert({title: 'Password reset failed', template: 'Password reset failed.'});
        }
      });
    }
  })
