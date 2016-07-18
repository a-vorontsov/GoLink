angular.module('app.controllers', [])
  .controller('settingsCtrl', function ($scope, $state, $ionicPopup, userDataService) {
    $scope.data = {
      'display_name': userDataService.getDisplayName(),
      'team': userDataService.getTeam()
    };
    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('splash');
      }).catch(function (error) {
        $ionicPopup.alert({title: 'Error', template: 'Unable to sign out. Try again later or clear app data/reinstall the app.'});
      })
    }
  })
