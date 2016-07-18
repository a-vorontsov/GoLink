angular.module('app.controllers')
  .controller('setupCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    $scope.data = {'displayName': '', 'team': 'Instinct'};
    $scope.sendSetup = function () {
      var displayName = $scope.data.displayName;
      var team = $scope.data.team;

      // TODO: Front-end and back-end validation

      $ionicLoading.show();
      var user = firebase.auth().currentUser;
      firebase.database().ref('members/' + user.uid).set({
        'display_name': displayName,
        'team': team
      }, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
        } else {
          $state.go('splash');
        }
      });
    }
  })
