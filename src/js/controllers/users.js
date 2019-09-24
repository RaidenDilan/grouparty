angular
  .module('pncApp')
  .controller('UsersShowCtrl', UsersShowCtrl)
  .controller('UsersEditCtrl', UsersEditCtrl);

UsersShowCtrl.$inject = ['User', '$stateParams', '$state', '$auth', 'ToastAlertService'];
function UsersShowCtrl(User, $stateParams, $state, $auth, ToastAlertService) {
  const vm = this;

  vm.user = User.get($stateParams);

  vm.delete = () => {
    vm.user
      .$remove()
      .then((user) => {
        $auth.logout();
        $state.go('login');
        ToastAlertService.customToast(`${user.data.message}`, '3000', 'success');
        // ToastAlertService.customToast(`${user.data.message}`, '3000', 'top right');
      });
  };
}

UsersEditCtrl.$inject = ['User', '$stateParams', '$state', 'ToastAlertService'];
function UsersEditCtrl(User, $stateParams, $state, ToastAlertService) {
  const vm = this;

  vm.user = User.get($stateParams);

  vm.update = () => {
    if(vm.usersEditForm.$valid) {
      vm.user
        .$update()
        .then(() => {
          $state.go('usersShow', $stateParams);
          ToastAlertService.customToast(`${vm.user.username} updated`, '3000', 'success');
        });

      vm.usersEditForm.$setUntouched();
      vm.usersEditForm.$setPristine();
    }
  };
}
