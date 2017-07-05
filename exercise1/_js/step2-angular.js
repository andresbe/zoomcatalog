var app = angular.module("app", []).controller("renderForm", ["$scope", function ($scope) { }]);
app.filter('renderFields', function () {
    return function (input, total) {
        for (var i = 0; i < parseInt(total); i++)
            input.push(i);
        return input;
    };
});