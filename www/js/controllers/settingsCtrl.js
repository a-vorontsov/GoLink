// TODO: Implement settings

angular.module('app.controllers')
  .controller('settingsCtrl', function ($scope, $state, $ionicPopup, $ionicLoading, userDataService) {

    $scope.data = {
      'displayName': userDataService.getDisplayName(),
      'team': userDataService.getTeam(),
      'radius': userDataService.getRadius(),
      'newDisplayName': userDataService.getDisplayName(),
      'newTeam': userDataService.getTeam(),
      'newRadius': userDataService.getRadius()
    };

    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('splash');
      }).catch(function (error) {
        $ionicPopup.alert({title: 'Error', template: 'Unable to sign out. Try again later or clear app data/reinstall the app.'});
      })
    };

    var updateDisplayName = function () {
      var displayName = $scope.data.newDisplayName;

      $ionicLoading.show();
      var userId = userDataService.getId();
      firebase.database().ref('members/' + userId + '/display_name').set(displayName, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
          $scope.data.newDisplayName = $scope.data.displayName;
        } else {
          userDataService.setDisplayName(displayName);
          $scope.data.displayName = displayName;
          $ionicPopup.alert({title: 'Display name updated', template: 'Your display name has successfully been updated.'});
        }
      });
    };
    $scope.showUpdateDisplayNamePopup = function () {
      $ionicPopup.show({
        template: '<input type="text" ng-model="data.newDisplayName" />',
        title: 'Enter your new display name',
        scope: $scope,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Update</b>',
            type: 'button-positive',
            onTap: function (e) {
              var displayName = $scope.data.newDisplayName;
              if (displayName.length < 1) {
                $ionicPopup.alert({title: "Validation failed", template: "Enter a display name."});
                e.preventDefault();
              } else if (displayName.length > 16) {
                $ionicPopup.alert({title: "Validation failed", template: "Your display name cannot be greater than 16 characters."});
                e.preventDefault();
              } else if (displayName == $scope.data.displayName) {
                $ionicPopup.alert({title: "Validation failed", template: "Your new display name cannot be the same as your current one."});
                e.preventDefault();
              } else {
                updateDisplayName();
              }
            }
          }
        ]
      });
    };

    var updateTeam = function () {
      var team = $scope.data.newTeam;

      $ionicLoading.show();
      var userId = userDataService.getId();
      firebase.database().ref('members/' + userId + '/team').set(team, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
          $scope.data.newDisplayName = $scope.data.displayName;
        } else {
          userDataService.setTeam(team);
          $scope.data.team = team;
          $ionicPopup.alert({title: 'Team updated', template: 'Your team has successfully been updated.'});
        }
      });
    };
    $scope.showUpdateTeamPopup = function () {
      $ionicPopup.show({
        template: '<label class="custom-select"><select ng-model="data.newTeam" class="text-input dropdown-box"><option value="Instinct">Instinct</option><option value="Mystic">Mystic</option><option value="Valor">Valor</option></select></label>',
        title: 'Select your team',
        scope: $scope,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Update</b>',
            type: 'button-positive',
            onTap: function (e) {
              var teams = ['Instinct', 'Mystic', 'Valor'];
              var team = $scope.data.newTeam;
              if (teams.indexOf(team) === -1) {
                $ionicPopup.alert({title: "Validation failed", template: "Select a valid team."});
                e.preventDefault();
              } else {
                updateTeam();
              }
            }
          }
        ]
      });
    };

    var updateRadius = function () {
      var radius = parseInt($scope.data.newRadius, 10);

      $ionicLoading.show();
      var userId = userDataService.getId();
      firebase.database().ref('members/' + userId + '/radius').set(radius, function (error) {
        $ionicLoading.hide();
        if (error) {
          $ionicPopup.alert({title: 'Error', template: 'Save failed. Try again later.'});
          $scope.data.newRadius = $scope.data.radius;
        } else {
          userDataService.setRadius(radius);
          $scope.data.radius = radius;
          $ionicPopup.alert({title: 'Radius updated', template: 'Your radius has been updated.'});
        }
      });
    };
    $scope.showUpdateRadiusPopup = function () {
      $ionicPopup.show({
        template: '<input type="range" step="1" min="1" max="30" value="15" ng-model="data.newRadius"/><span class="">{{data.newRadius}}</span>',
        title: 'Select the radius of trainers around you to be shown',
        scope: $scope,
        buttons: [
          {text: 'Cancel'},
          {
            text: '<b>Update</b>',
            type: 'button-positive',
            onTap: function (e) {
              var radius = parseInt($scope.data.newRadius, 10);
              if (isNaN(radius) || (radius > 30 || radius < 1)) {
                $ionicPopup.alert({title: "Validation failed", template: "The radius must be within 1km and 30km."});
                e.preventDefault();
              } else {
                updateRadius();
              }
            }
          }
        ]
      });
    };
  });
