var app = angular.module("exercise2", []).run(["$rootScope", function ($rootScope) {
	$rootScope.api_url = 'https://reqres.in/api/'
	if (localStorage.getItem('user'))
		$rootScope.logged_user = JSON.parse(localStorage.getItem('user'));
}]);

app.factory('UserServices', function ($http, $q, $rootScope) {
	return {
		loginUserRequest: function loginUserRequest(email, password) {
			var q = $q.defer();
			$http({
				method: 'post',
				url: $rootScope.api_url + 'login',
				data: { "email": email, "password": password },
				config: 'Content-Type: application/json;'
			}).then(function (response) {
				$rootScope.logged_user = { userEmail: email, token: response.data.token };
				localStorage.setItem("user", JSON.stringify($rootScope.logged_user));
				q.resolve(response);

			}, function (response) {
				q.reject(response);
			});

			return q.promise;
		},
		validateUserSession: function () {

			if (localStorage.getItem('user'))
				if (!$rootScope.logged_user)
					$rootScope.logged_user = JSON.parse(localStorage.getItem('user'));

			if ($rootScope.logged_user)
				return true;
			else
				return false;
		}
	};
});

app.controller("myCtrl", ["$scope", "$filter", "UserServices", "$rootScope", "$timeout", function ($scope, $filter, UserServices, $rootScope, $timeout) {

	$scope.links = []
	$scope.userVotes = []

	if (localStorage.getItem('links'))
		$scope.links = JSON.parse(localStorage.getItem('links'));

	if (localStorage.getItem('userVotes'))
		$scope.userVotes = JSON.parse(localStorage.getItem('userVotes'));

	$scope.addItem = function () {
		if (UserServices.validateUserSession()) {
			if ($scope.links) {
				var tmpSite = $filter("filter")($scope.links, { site: $scope.addMe.site });
				if (tmpSite.length == 0) {
					$scope.addMe.votes = 0
					$scope.links.push($scope.addMe)
					$scope.updateCookie("links", $scope.links)
					$scope.addMe = {}
				}
			}
			else {
				$scope.addMe.votes = 0
				$scope.links.push($scope.addMe)
				$scope.updateCookie("links", $scope.links)
				$scope.addMe = {}
			}

		}
		else
			$('#loginModal').modal('show');
	}

	$scope.updateCookie = function (cookie, val) {
		localStorage.setItem(cookie, JSON.stringify(val));
	}

	$scope.changeVote = function (vote, flag) {
		var vote = { site: vote.site, vote: flag }

		var tmpSite = $filter("filter")($scope.links, { site: vote.site })[0]
		if ($scope.userVotes.length > 0 && $filter("filter")($scope.userVotes, { site: vote.site })[0]) {
			var tmpVote = $filter("filter")($scope.userVotes, { site: vote.site })[0]
			if (flag != tmpVote.vote) {
				var value = (tmpVote.vote == '+1') ? '-1' : '+1'
				if (value == '-2' && parseInt(tmpSite.votes) == 1)
					tmpSite.votes = 0
				else if (value == '+2' && parseInt(tmpSite.votes) == 0)
					tmpSite.votes = 1
				else
					tmpSite.votes = eval(tmpSite.votes + value)

				tmpVote.vote = flag
				$scope.updateCookie("links", $scope.links)
				$scope.updateCookie("userVotes", $scope.userVotes)
			}
			else //recuerda restar -1
			{
				var tmpVote = $filter("filter")($scope.userVotes, { site: vote.site })[0]
				$scope.userVotes.splice($scope.userVotes.indexOf(tmpVote), 1)
				$scope.updateCookie("userVotes", $scope.userVotes)

				var value = (tmpVote.vote == '+1') ? '-1' : '+1'
				tmpSite.votes = eval(tmpSite.votes + value);
				$scope.updateCookie("links", $scope.links)
			}

		}
		else {
			if (!(flag == '-1' && tmpSite.votes == 0)) {
				$scope.userVotes.push(vote)
				$scope.updateCookie("userVotes", $scope.userVotes)

				tmpSite.votes = eval(parseInt(tmpSite.votes) + flag)
				$scope.links.splice($scope.links.indexOf(tmpSite), 1, tmpSite)
				$scope.updateCookie("links", $scope.links);
			}

		}
	};

	$scope.getClass = function (site, direction) {
		if ($scope.userVotes.length > 0 && $filter("filter")($scope.userVotes, { site: site.site })[0]) {
			var tmpVote = $filter("filter")($scope.userVotes, { site: site.site })[0]
			if (tmpVote.vote == direction)
				if (direction == '+1')
					return 'vote-up'
				else
					return 'vote-down'
			else
				return;
		}
		else
			return;

	}

	$scope.logout = function () {
		localStorage.setItem("user", '');
		localStorage.setItem("userVotes", '')
		window.location.href = ""
	}

	var countDown = function () {
		if ($scope.links) {
			$scope.links.forEach(function (site) {
				$scope.voteDecrease(site);
			}, this);
			$timeout(countDown, 10000);
		}
	}
	$timeout(countDown, 30000);
}]);

app.controller("loginController", ["$rootScope", "$scope", "UserServices", function ($rootScope, $scope, UserServices) {
	$scope.user = {}
	$scope.loginError = ''
	$scope.login = function () {
		var loginRequest = UserServices.loginUserRequest($scope.user.name, $scope.user.password);
		loginRequest.then(function (response) {
			$('#loginModal').modal('hide');
		}, function (response) {
			$scope.loginError =  response.data.error
		});
	}
}]);