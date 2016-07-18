angular.module('app.controllers')
  .controller('loginCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    $scope.data = {};

    $scope.login = function () {
      // TODO: Validation on both front-end and back-end

      var email = $scope.data.email;
      var password = $scope.data.password;

      $ionicLoading.show();
      firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
        $scope.data.email = '';
        $scope.data.password = '';
        $ionicLoading.hide();
        $state.go('splash');

      }).catch(function (error) {
        $ionicLoading.hide();
        var errorCode = error.code;
        if (errorCode === "auth/user-disabled") {
          $ionicPopup.alert({title: "Login failed", template: "Your account has been disabled. Contact support for more info."});
        } else if (errorCode === "auth/network-request-failed") {
          $ionicPopup.alert({title: "Login failed", template: "Unable to connect to the server. Check your internet connection and try again."});
        } else {
          $ionicPopup.alert({title: "Login failed", template: "The credentials you entered are invalid."});
        }
      });
    }
  });