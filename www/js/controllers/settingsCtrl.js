// TODO: Implement settings

angular.module('app.controllers')
  .controller('settingsCtrl', function ($scope, $state, $ionicPopup, $ionicLoading, userDataService) {

    $scope.data = {
      'display_name': userDataService.getDisplayName(),
      'team': userDataService.getTeam(),
      'radius': userDataService.getRadius()
    };

    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('splash');
      }).catch(function (error) {
        $ionicPopup.alert({title: 'Error', template: 'Unable to sign out. Try again later or clear app data/reinstall the app.'});
      })
    };

    $scope.updateDisplayName = function () {
      var displayName = $scope.data.new_display_name;
      $scope.data.new_display_name = '';

      if (displayName.length < 1) {
        $ionicPopup.alert({title: "Validation failed", template: "Enter a display name."});
        return;
      } else if (displayName.length > 16) {
        $ionicPopup.alert({title: "Validation failed", template: "Your display name cannot be greater than 16 characters."});
        return;
      }

      $ionicLoading.show();
      var user = firebase.auth().currentUser;
      firebase.database().ref('members/' + user.uid).set({
        'display_name': displayName
      }, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
        } else {
          userDataService.setDisplayName(displayName);
          $scope.data.display_name = displayName;
          $ionicPopup.alert({title: 'Display name updated', template: 'Your display name has successfully been updated.'});
        }
      });
    };

    $scope.updateTeam = function () {
      var teams = ['Instinct', 'Mystic', 'Valor'];
      var team = $scope.data.new_team;
      $scope.data.new_team = '';

      if (teams.indexOf(team) === -1) {
        $ionicPopup.alert({title: "Validation failed", template: "Select a valid team."});
        return;
      }

      $ionicLoading.show();
      var user = firebase.auth().currentUser;
      firebase.database().ref('members/' + user.uid).set({
        'team': team
      }, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
        } else {
          userDataService.setTeam(team);
          $scope.dsata.team = team;
          $ionicPopup.alert({title: 'Team updated', template: 'Your team has successfully been updated.'});
        }
      });
    };

    $scope.updateRadius = function () {
      var radius = $scope.data.new_radius;
      $scope.data.new_radius = $scope.data.radius;

      $ionicLoading.show();
      firebase.database().ref('members/' + user.uid).set({
        'radius': radius
      }, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
        } else {
          userDataService.setRadius(radius);
          $scope.data.radius = radius;
          $ionicPopup.alert({title: 'Radius updated', template: 'Your radius has been updated. Restart the app for your changes to take action.'});
        }
      });
    }
  });
