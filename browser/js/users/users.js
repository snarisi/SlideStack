app.config(function ($stateProvider) {
    $stateProvider
    .state('user', {
        url: '/users/:id',
        templateUrl: 'js/users/profile/profile.html',
        controller: 'UserCtrl',
        resolve: {
            user: function (UserFactory, $stateParams) {
                return UserFactory.fetchById($stateParams.id);
            }
        }
    })
    .state('user.classes', {
        url: '/classes',
        templateUrl: 'js/users/profile/profile.classes.html'
    })
    .state('user.presentations', {
        url: '/presentations',
        templateUrl: 'js/users/profile/profile.presentations.html'
    })
});

app.controller('UserCtrl', function ($scope, $state, user, Presentation) {
    $scope.newPresMenu = false;
    $scope.createPresentation = function (newPres) {
        Presentation.create(newPres)
            .then(createdPres => $state.go('editPres', { id: createdPres._id }))
    };

    $scope.user = user;
});
