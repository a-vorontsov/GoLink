angular.module('app.controllers')
  .controller('setupCtrl', function ($scope, $state, $ionicPopup, $ionicLoading) {
    var teams = ['Instinct', 'Mystic', 'Valor'];

    $scope.data = {'displayName': '', 'team': 'Instinct', 'radius': '15'};
    $scope.sendSetup = function () {
      var displayName = $scope.data.displayName;
      var team = $scope.data.team;
      var radius = parseInt($scope.data.radius, 10);

      if (displayName.length < 1) {
        $ionicPopup.alert({title: "Validation failed", template: "Enter a display name."});
        return;
      } else if (displayName.length > 16) {
        $ionicPopup.alert({title: "Validation failed", template: "Your display name cannot be greater than 16 characters."});
        return;
      } else if (teams.indexOf(team) === -1) {
        $ionicPopup.alert({title: "Validation failed", template: "Select a valid team."});
        return;
      } else if (isNaN(radius) || (radius > 30 || radius < 1)) {
        $ionicPopup.alert({title: "Validation failed", template: "The radius must be within 1km and 30km."});
        return;
      }

      $ionicLoading.show();
      var user = firebase.auth().currentUser;
      firebase.database().ref('members/' + user.uid).set({
        'display_name': displayName,
        'team': team,
        'radius': radius
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
