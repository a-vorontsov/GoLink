angular.module('app.controllers')
  .controller('setupCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    var teams = ['Instinct', 'Mystic', 'Valor'];

    $scope.data = {'displayName': '', 'team': 'Instinct'};
    $scope.sendSetup = function () {
      var displayName = $scope.data.displayName;
      var team = $scope.data.team;

      if (displayName.length < 1 || teams.indexOf(team) === -1) {
        $ionicPopup.alert({title: "Validation failed", template: "Enter a valid display name/select a team and try again."});
        return;
      }

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
  });
