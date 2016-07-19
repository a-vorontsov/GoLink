// TODO: Test this part of the app
angular.module('app.controllers')
  .controller('setupCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    var teams = ['Instinct', 'Mystic', 'Valor'];

    $scope.data = {'displayName': '', 'team': 'Instinct'};
    $scope.sendSetup = function () {
      var displayName = $scope.data.displayName;
      var team = $scope.data.team;

      if (displayName.length < 1) {
        $ionicPopup.alert({title: "Validation failed", template: "Enter a display name."});
        return;
      } else if (displayName.length > 16) {
        $ionicPopup.alert({title: "Validation failed", template: "Your display name cannot be greater than 16 characters."});
        return;
      } else if (teams.indexOf(team) === -1) {
        $ionicPopup.alert({title: "Validation failed", template: "Select a valid team."});
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
