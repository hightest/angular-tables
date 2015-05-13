angular.module('demo', ['ht.tables']).controller('DemoCtrl', function ($scope, $q, $timeout) {
    var expand = {id: 1, name: "a11", age: 34};

    $scope.data = [
        {id: 1, name: "Moroni", age: 50},
        {id: 1, name: "Tiancum", age: 43},
        {id: 1, name: "Jacob", age: 27},
        {id: 1, name: "Nephi", age: 29},
        {id: 1, name: "Enos", age: 34},
        {id: 1, name: "Tiancum", age: 43},
        {id: 1, name: "Jacob", age: 27},
        {id: 1, name: "Nephi", age: 29},
        {id: 1, name: "Enos", age: 33},
        {id: 1, name: "Tiancum", age: 43},
        {id: 1, name: "Jacob", age: 27},
        {id: 1, name: "Nephi", age: 29},
        {id: 1, name: "Enos", age: 34},
        {id: 1, name: "Tiancum", age: 43},
        {id: 1, name: "Jacob", age: 27},
        {id: 1, name: "Nephi", age: 29},
        {id: 1, name: "a2", age: 34},
        expand,
        {id: 1, name: "a23", age: 34}
    ];


        var deferred = $q.defer();
        $timeout(function() {
            deferred.resolve(expand);
        }, 1000);

    $scope.settings = {
        id: 'table-id',
        fields: [
            {
                name: 'imię',
                field: 'name',
                visible: false
            },
            {
                name: 'wiek',
                field: 'age',
                type: 'sum'
            },
            {
                name: 'Template',
                type: 'template',
                templateUrl: 'template.html'
            }
        ],
        filters: [
           // {field: "age", value: "50", filter: "filter"}
        ],
        selectFilters: [
            {
                name: "W wieku",
                options: [
                    {name: "50 lat", field: "age", value: 50, type: "filter"},
                    {name: "34 lat", field: "age", value: 34, type: "filter"}
                ]
            }
        ],
        expanded: deferred.promise,
        activeStyle: 'active',
        showFilters: true,
        selectMultiple: true,
        onClick: function(row) {
            console.log(row);
        }
    };

});
angular.module('demo').run(function($templateCache) {
    $templateCache.put("template.html","<div>{{ row.name }}!</div>");
});
