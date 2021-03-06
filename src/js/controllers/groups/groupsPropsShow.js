angular
  .module('groupartyApp')
  .controller('GroupsPropsShowCtrl', GroupsPropsShowCtrl)
  .controller('UserImageModalCtrl', UserImageModalCtrl);

GroupsPropsShowCtrl.$inject = ['$stateParams', '$scope', '$state', '$http', 'Group', 'GroupProperty', 'GroupPropertyComment', 'GroupPropertyImage', 'GroupPropertyRating', 'Crimes', '$mdDialog', '$moment', 'ToastAlertService', '$timeout', '$auth'];
function GroupsPropsShowCtrl($stateParams, $scope, $state, $http, Group, GroupProperty, GroupPropertyComment, GroupPropertyImage, GroupPropertyRating, Crimes, $mdDialog, $moment, ToastAlertService, $timeout, $auth) {
  const vm = this;

  const authUserId = $auth.getPayload().userId;

  vm.group = Group.get($stateParams);
  vm.listingLat = null;
  vm.listingLon = null;
  vm.geometry = null;
  vm.listingId = $stateParams.listing_id;
  vm.crimes = [];
  vm.crimes.crimeData = [];
  vm.toastDelay = 2000;
  vm.toastStatus = 'success';
  vm.labels = ['Anti Social Behaviour', 'Burglary', 'Bike Theft', 'Drugs', 'Robbery', 'Vehicle Crimes', 'Violent Crimes'];
  vm.isLoading = false;
  vm.readOnly = true;
  vm.voted = null;

  if (vm.group) getGroup();

  function getGroup() {
    Group
      .get($stateParams)
      .$promise
      .then(data => {
        vm.group = data;
        getGroupProperty();
        vm.prop = vm.group.properties.find(obj => obj.listingId === vm.listingId);
        vm.prop.createdAt = $moment(vm.prop.createdAt).fromNow();
        vm.prop.ratings.forEach(rating => rating.createdAt = $moment(rating.createdAt).fromNow());
        vm.prop.images.forEach(image => image.createdAt = $moment(image.createdAt).fromNow()); // .fromNow(true);
        vm.prop.comments.forEach(comment => comment.createdAt = $moment(comment.createdAt).fromNow());
        vm.voted = vm.prop.ratings.find(obj => obj.createdBy.id === authUserId);
        // vm.ratings = vm.prop.ratings.length;
      });
  }

  function getGroupProperty() {
    $http
      .get('/api/groups/:id/properties/:listingId', { params: { id: vm.group.id, listingId: vm.listingId } })
      .then(response => {
        vm.properties = response.data;
        vm.listingLat = vm.properties.listing[0].latitude;
        vm.listingLon = vm.properties.listing[0].longitude;
        vm.geometry = `${ vm.listingLat },${ vm.listingLon }`;
        getPropertyCrimes();
      });
  }

  function getPropertyCrimes() {
    if (!vm.listingLat) return false;

    Crimes
      .getCrimes(vm.listingLat, vm.listingLon)
      .then(data => vm.crimes = data);
  }

  // HELPER FUNCTIONS
  function toggleVoted() {
    vm.voted = !vm.voted;
    // vm.voted = vm.voted === true ? false : true;
  }

  function toggleLoading() {
    vm.isLoading = !vm.isLoading;
    // vm.isLoading = vm.isLoading === false ? true : false;
  }

  vm.addRating = () => {
    GroupPropertyRating
      .save({ id: vm.group.id, listingId: vm.listingId }, vm.newRating)
      .$promise
      .then(rating => {
        vm.prop.ratings.push(rating);
        vm.newRating = {};
      })
      .then(rating => {
        ToastAlertService.customToast('Rating posted', vm.toastDelay, vm.toastStatus);
        toggleVoted();
      });
  };

  // vm.deleteRating = (rating) => {
  //   GroupPropertyRating
  //     .delete({ id: vm.group.id, listingId: vm.listingId, ratingId: rating.id })
  //     .$promise
  //     .then(() => {
  //       const index = vm.prop.ratings.indexOf(rating);
  //       return vm.prop.ratings.splice(index, 1);
  //     })
  //     .then(() => {
  //       ToastAlertService.customToast('Rating deleted', vm.toastDelay, vm.toastStatus);
  //       toggleVoted();
  //     });
  // };

  vm.addImage = () => {
    vm.isLoading = true;

    GroupPropertyImage
      .save({ id: vm.group.id, listingId: vm.listingId }, vm.newImage)
      .$promise
      .then(image => {
        image.createdAt = $moment(this.newImage.createdAt).fromNow(); // .fromNow(true);
        vm.prop.images.push(image);
        vm.newImage = {};
      })
      .then(image => {
        toggleLoading();
        ToastAlertService.customToast('Image uploaded', vm.toastDelay, vm.toastStatus);
      });
  };

  vm.deleteImage = image => {
    GroupPropertyImage
      .delete({ id: vm.group.id, listingId: vm.listingId, imageId: image.id })
      .$promise
      .then(() => {
        const index = vm.prop.images.indexOf(image);
        return vm.prop.images.splice(index, 1);
      })
      .then(() => ToastAlertService.customToast('Image deleted', vm.toastDelay, vm.toastStatus));
  };

  vm.addComment = () => {
    GroupPropertyComment
      .save({ id: vm.group.id, listingId: vm.listingId }, vm.newComment)
      .$promise
      .then(comment => {
        comment.createdAt = $moment(comment.createdAt).fromNow();
        // comment.createdAt = $moment(vm.newComment.createdAt).fromNow();
        vm.prop.comments.push(comment);
        vm.newComment = {};
      })
      .then(() => ToastAlertService.customToast('Comment posted', vm.toastDelay, vm.toastStatus));
  };

  vm.deleteComment = comment => {
    GroupPropertyComment
      .delete({ id: vm.group.id, listingId: vm.listingId, commentId: comment.id })
      .$promise
      .then(() => {
        const index = vm.prop.comments.indexOf(comment);
        return vm.prop.comments.splice(index, 1);
      })
      .then(() => ToastAlertService.customToast('Commend deleted', vm.toastDelay, vm.toastStatus));
  };

  vm.deleteProperty = property => {
    GroupProperty
      .delete({ id: vm.group.id, listingId: vm.listingId })
      .$promise
      .then(() => {
        const index = vm.group.properties.indexOf(property);
        vm.group.properties.splice(index, 1);
        return $state.go('groupsHome', { id: vm.group.id });
      })
      .then(() => ToastAlertService.customToast(`${ property.listing_id } deleted from ${ vm.group.groupName } group`, vm.toastDelay, vm.toastStatus));
  };

  vm.showUserImage = thisImage => {
    $mdDialog.show({
      controller: UserImageModalCtrl,
      controllerAs: 'userImageModal',
      templateUrl: 'js/views/modals/image.html',
      parent: angular.element(document.body),
      targetEvent: thisImage,
      clickOutsideToClose: true,
      escapeToClose: true,
      fullscreen: false,
      resolve: {
        selectedImage: () => {
          return thisImage;
        }
      }
    });
  };
}

UserImageModalCtrl.$inject = ['selectedImage', '$mdDialog'];
function UserImageModalCtrl(selectedImage, $mdDialog) {
  const vm = this;

  vm.selected = selectedImage;
  vm.hide = () => $mdDialog.hide();
  vm.cancel = () => $mdDialog.cancel();
  vm.showUserId = userId => $mdDialog.hide(userId);
}

// vm.chartOptions = {
//   responsive: true, // set to false to remove responsiveness. Default responsive value is true.
//   legend: {
//     display: true,
//     position: 'right',
//     fullWidth: false,
//     labels: {
//       fontColor: 'rgb(255, 99, 132)'
//     },
//     onClick: (e) => e.stopPropagation(),
//   }
// };
