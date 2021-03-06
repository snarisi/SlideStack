/**
 * Created by Jon on 2/4/16.
 */

// Students
app.config(function ($stateProvider) {
    $stateProvider.state('viewPres', {
        url: '/presentations/:id/student',
        templateUrl: 'js/presentations/studentView/studentPresentation.html',
        resolve: {
            presentation: (PresentationFactory, $stateParams) => {
                return PresentationFactory.fetchById($stateParams.id);
            },
            user: (AuthService) => {
                return AuthService.getLoggedInUser();
            }
        },
        controller: ($scope, presentation, Socket, user, $uibModal) => {
            $scope.presentation = presentation;
            $scope.slides = presentation.markdown.split('$$$');

            Socket.joinRoom({
                presentation: presentation._id
            });

            $scope.user = user;

            if ($scope.user) $scope.user.confused = false;

            $scope.open = (size) => {

                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'myModalContent.html',
                    controller: 'ModalInstanceCtrl',
                    size: size,
                    resolve: {
                        user: () => {
                            return $scope.user;
                        }
                    }
                });

                modalInstance.result.then(selectedItem => {
                    $scope.selected = selectedItem;
                }, function () {
                    //$log.info('Modal dismissed at: ' + new Date());
                });
            };
        }
    })
}).controller('ModalInstanceCtrl', ($scope, $uibModalInstance, user, Socket) => {
    $scope.user = user;

    $scope.toggleConfusion = () => {
        if (!$scope.user.confused) {
            Socket.emitConfusion(user);
            $scope.user.confused = true;
        } else {
            Socket.retractConfusion(user);
            $scope.user.confused = false;
        }
    };

    $scope.anonymous = false;
    $scope.submitQuestion = (question, anonymous) => {
        Socket.askQuestion(
            {user: user, question: question, anonymous: anonymous});
        $uibModalInstance.close();
    };

    $scope.cancel = () => {
        $uibModalInstance.dismiss('cancel');
    };
});
