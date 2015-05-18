(function() {
    function htTableDirective() {
        return {
            templateUrl: 'ht-table/layout.html',
            require: '^ngModel',
            scope: {
                settings: '=htTable',
                data: '=ngModel'
            },
            controllerAs: 'htTable',
            controller: TableController
        };

        function TableController($scope, $filter, $q, $timeout) {
            var self = this;
            var settings;
            var originalData = [];
            var filteredData = [];
            var sortedData = [];

            self.filterTypes = [
                {
                    'name': 'Szukaj w',
                    'value': 'filter'
                },
                {
                    'name': 'Mniejszy od',
                    'value': 'lessThanOrEqualTo'
                },
                {
                    'name': 'Większy od',
                    'value': 'greaterThanOrEqualTo'
                }
            ];

            // functions
            self.getIndex = index;
            self.rowStyle = rowStyle;
            self.getValue = getValue;
            self.changeSorting = changeSorting;
            self.getFieldClass = getFieldClass;
            self.showPagination = showPagination;
            self.updatePagination = updatePagination;
            self.selectMultiple = selectMultiple;
            self.showFilters = showFilters;
            self.addFilter = addFilter;
            self.removeFilter = removeFilter;
            self.updateFilter = updateFilter;
            self.export = exportBody;
            self.exportHeader = exportHeader;
            self.expand = expand;
            self.hasSum = hasSum;
            self.sum = sum;
            self.sums = {};
            self.countColumns = countColumns;

            $q.when($scope.data).then(function(result) {
                originalData = result;
                init();
            });

            function init() {
                var oldSettings = {
                    activeStyle: 'active',
                    showFilters: true,
                    pagination: {
                        total: 0,
                        current: 1,
                        itemsPerPage: 10,
                        show: true
                    },
                    filters: [],
                    selectFilters: [],
                    sorting: [],
                    selectMultiple: false,
                    expanded: null,
                    expand: false,
                    onClick: function() {}
                };

                settings = angular.merge({}, oldSettings, $scope.settings);
                settings.expanded = $scope.settings.expanded;
                self.data = [];
                self.fieldFilter = { visible: true };
                self.pagination = settings.pagination;
                self.filters = settings.filters;
                self.filterFields = [{name: "Wszędzie", field: "$"}].concat(settings.fields);
                self.selectFilters = settings.selectFilters;
                self.expanded = settings.expanded;

                prepareFields();
                initFiltering();
                if (null !== settings.expanded) {
                    $q.when(settings.expanded).then(function(result) {
                        self.expanded = result;
                        goToRow(result);
                    });
                }
            }

            function initFiltering() {
                filter();
                sort();
                settings.pagination.current = 1;
                initSorting();
            }

            function initSorting() {
                sort();
                initPagination();
            }

            function initPagination() {
                paginate();
            }

            function expand(row) {
                if (!settings.expand) return;

                if (self.expanded == row) {
                    self.expanded = null;
                } else {
                    self.expanded = row;
                }
                settings.onClick(row);
            }

            function goToRow(object) {
                var length = sortedData.length;
                var position = 0;
                for (var i = 0; i < length; i++) {
                    if (angular.equals(sortedData[i], object)) {
                        position = i;
                        break;
                    }
                }
                self.expanded = sortedData[i];
                settings.pagination.current = parseInt(position / settings.pagination.itemsPerPage) + 1;
                initPagination();
            }

            function prepareFields() {
                for (var i = 0, length = settings.fields.length; i < length; i++) {
                    var field = settings.fields[i];
                    if (angular.isUndefined(field.visible) || field.visible) {
                        field.visible = true;
                    }
                }

                self.fields = settings.fields;
            }

            function countColumns() {
                var result = 1;
                if (settings.selectMultiple) result++;

                result += $filter('field')(self.fields).length;

                return result;
            }

            function showFilters() {
                return settings.showFilters;
            }

            function selectMultiple()
            {
                return settings.selectMultiple;
            }

            function sort() {
                var predicates = [];

                for (var i = 0, count = settings.sorting.length; i < count; i++) {
                    var sortField = settings.sorting[i];
                    var predicate = '';

                    if (sortField.sort == 'asc') {
                        predicate = '+';
                    } else {
                        predicate = '-';
                    }

                    predicate += sortField.field;
                    predicates.push(predicate);
                }

                sortedData = settings.sorting.length ? $filter('natural')(filteredData, predicates) : filteredData;
            }

            function paginate() {
                var pagination = settings.pagination;

                pagination.total = sortedData.length;
                if (pagination.itemsPerPage) {
                    self.data = sortedData.slice(
                        (pagination.current - 1) * pagination.itemsPerPage,
                        pagination.current * pagination.itemsPerPage
                    );
                } else {
                    self.data = sortedData;
                }
            }

            function showPagination() {
                var pagination = settings.pagination;

                return !(!pagination.show || pagination.total <= 10);
            }

            function updatePagination() {
                initPagination();
            }

            function index() {
                return (settings.pagination.current - 1) * settings.pagination.itemsPerPage;
            }

            function rowStyle(row) {
                if (angular.isDefined(row.$htTable) && row.$htTable.selected)
                    return settings.activeStyle;

                return '';
            }

            function hasSum() {
                for (var i = 0, count = self.fields.length; i < count; i++) {
                    if (angular.isDefined(self.fields[i].type) && self.fields[i].type == 'sum')
                        return true;
                }

                return false;
            }

            function sum(field) {
                var result = 0;

                var count = filteredData.length;
                for (var i = 0; i < count; i++) {
                    var row = filteredData[i];
                    if (angular.isDefined(row.$htTable) && row.$htTable.selected)
                        result += row[field];
                }

                return result;
            }

            function updateSums() {
                var deferred = $q.defer();

                return deferred.promise;
            }

            function getValue(field, row) {
                if (angular.isUndefined(field.field)) return;
                var value = field.field;
                var arrayField = value.split('.');
                var result = row;

                for (var i = 0, count = arrayField.length; i < count; i++) {
                    var entry = arrayField[i];

                    if (null !== result && result.hasOwnProperty(entry)) {
                        result = result[entry];
                    } else {
                        return '';
                    }
                }

                if (angular.isDefined(field.filter)) {
                    result = $filter(field.filter)(result);
                }

                return result;
            }

            function changeSorting(field, $event) {
                var shift = $event.shiftKey;

                var fieldPosition = findField(field);

                var newField = {};

                if (null === fieldPosition)
                    newField = {field: field.field, sort: 'asc'};
                else
                    newField = settings.sorting[fieldPosition];

                if (null !== fieldPosition) {
                    var sort = newField.sort;
                    if (sort == 'asc') {
                        settings.sorting[fieldPosition].sort = 'desc';
                        if (!shift) {
                            settings.sorting = [settings.sorting[fieldPosition]];
                        }
                    } else {
                        if (shift)
                            settings.sorting.splice(fieldPosition, 1);
                        else
                            settings.sorting.length = 0;
                    }
                } else {
                    if (shift)
                        settings.sorting.push(newField);
                    else {
                        settings.sorting.length = 0;
                        settings.sorting.push(newField);
                    }
                }

                initSorting();
            }

            function findField(field) {
                for (var i = 0; i < settings.sorting.length; i++) {
                    if (settings.sorting[i].field == field.field) {
                        return i;
                    }
                }

                return null;
            }

            function getFieldClass(field) {
                for (var i = 0; i < settings.sorting.length; i++) {
                    if (field.field == settings.sorting[i].field) {
                        if (settings.sorting[i].sort == 'asc')
                            return 'ht-table-icon-up';
                        else
                            return 'ht-table-icon-down';
                    }
                }
                return '';
            }

            // filters
            function addFilter() {
                self.filters.push({
                    filter: self.filterTypes[0].value,
                    field: '$',
                    value: ''
                });
            }

            function removeFilter(index) {
                var filterValue = self.filters[index].value;
                self.filters.splice(index, 1);
                if (filterValue.length > 0) {
                    updateFilter();
                }
            }

            var timeout = null;
            function updateFilter() {
                if (timeout) {
                    $timeout.cancel(timeout);
                }
                timeout = $timeout(initFiltering, 500);
            }

            function filter() {
                var data = originalData;
                var filters = transformFilter(self.filters);
                filters = addSelectFilters(filters);

                for (var key in filters) {
                    if (!filters.hasOwnProperty(key)) continue;

                    var value = filters[key];
                    value = getFlatObjects(value);
                    if (value.length === 1) {
                        value[0] = convertValue(value[0]);
                        if (key == 'filter' && angular.isDefined(value[0].$) && value[0].$.length) {
                            var oldVal = value[0].$;
                            var vals = oldVal.split(' ');
                            for (var k = 0; k < vals.length; k++) {
                                value[0].$ = vals[k];
                                data = $filter(key)(data, value[0]);
                            }
                        } else {
                            data = $filter(key)(data, value[0]);
                        }
                    } else {
                        var result = [];


                        var valueLength = value.length;
                        for (var i = 0; i < valueLength; i++) {
                            var newData = data.slice();
                            if (key == 'filter' && angular.isDefined(value[i].$) && value[i].$.length) {
                                var old = value[i].$;
                                var values = old.split(' ');
                                for (var m = 0; m < values.length; m++) {
                                    value[i].$ = values[m];
                                    newData = $filter(key)(newData, value[i]);
                                }
                            } else {
                                newData = $filter(key)(newData, value[i]);
                            }
                            result = result.concat(newData);
                        }

                        for (i = 0; i < result.length; i++) {
                            for (var j = i + 1; j < result.length; j++) {
                                if (result[i] == result[j]) {
                                    result.splice(j--, 1);
                                }
                            }
                        }
                        data = result;
                    }
                }

                filteredData = data;
            }

            function transformFilter(filters) {
                var result = {};

                var count = filters.length;
                for (var i = 0; i < count; ++i) {
                    var filter = filters[i];

                    if (filter.value.length) {
                        if (angular.isUndefined(result[filter.filter])) {
                            result[filter.filter] = {};
                        }
                        if (angular.isDefined(result[filter.filter][filter.field])) {
                            if (!Array.isArray(result[filter.filter][filter.field])) {
                                result[filter.filter][filter.field] = [result[filter.filter][filter.field]];
                            }
                            result[filter.filter][filter.field].push(filter.value);
                        } else {
                            result[filter.filter][filter.field] = filter.value;
                        }
                    }
                }

                return result;
            }

            function addSelectFilters(filters) {
                var selectFilters = settings.selectFilters;
                var countFilters = selectFilters.length;

                for (var i = 0; i < countFilters; ++i) {
                    var filter = selectFilters[i];
                    var countOptions = filter.options.length;

                    for (var j = 0; j < countOptions; ++j) {
                        var option = filter.options[j];

                        if (angular.isDefined(option.selected) && option.selected) {
                            var filterName = option.type;
                            var filterField = option.field;
                            var filterValue = option.value;

                            if (!angular.isDefined(filters[filterName])) {
                                filters[filterName] = {};
                            }
                            if (angular.isDefined(filters[filterName][filterField]) && (filters[filterName][filterField].length > 0 || angular.isNumber(filters[filterName][filterField]))) {
                                if (!Array.isArray(filters[filterName][filterField])) {
                                    filters[filterName][filterField] = [filters[filterName][filterField]];
                                }
                                filters[filterName][filterField].push(filterValue);
                            } else {
                                filters[filterName][filterField] = filterValue;
                            }
                        }
                    }
                }

                return filters;
            }

            function getFlatObjects(object) {
                var elements = [];
                angular.forEach(object, function(value, key) {
                    if (Array.isArray(value)) {
                        angular.forEach(value, function(datum) {
                            var flatObject = angular.copy(object);
                            flatObject[key] = datum;
                            elements = elements.concat(getFlatObjects(flatObject));
                        });
                    }
                });
                if (elements.length === 0) {
                    elements.push(object);
                }
                return elements;
            }

            function buildObject(key, value, object, objectKey) {
                var index = key.indexOf('.');

                if (index === -1) {
                    if (objectKey) {
                        if (typeof object[objectKey] === 'undefined')  object[objectKey] = {};
                        object[objectKey][key] = value;
                    } else {
                        object[key] = value;
                    }
                } else {
                    var currentKey = key.split('.', 1)[0];
                    var nextKey = key.substr(index + 1);
                    if (objectKey) {
                        if (typeof object[objectKey] === 'undefined') object[objectKey] = {};
                        object = object[objectKey];
                    }
                    buildObject(nextKey, value, object, currentKey);
                }
            }

            function convertValue(object) {
                var result = {};
                var keys = Object.keys(object);

                for (var i = 0, count = keys.length; i < count; i++) {
                    buildObject(keys[i], object[keys[i]], result);
                }

                return result;
            }

            function exportBody() {
                var data = originalData;
                var count = data.length;
                var result = [];
                for (var i = 0; i < count; i++) {
                    var row = [];
                    for (var k = 0; k < self.fields.length; k++) {
                        var field = self.fields[k];
                        if (!field.visible || angular.isUndefined(field.field)) continue;
                        row.push(getValue(field, data[i]));
                    }
                    result.push(row);
                }
                return result;
            }

            function exportHeader() {
                var result = [];

                for (var i = 0; i < self.fields.length; i++) {
                    var field = self.fields[i];

                    if (!field.visible || angular.isUndefined(field.field)) continue;

                    result.push(field.name);
                }

                return result;
            }
        }
    }

    function htFocusDirective() {
        return function (scope, element) {
            element[0].focus();
        };
    }

    function FieldFilter() {
        return function(input) {
            var data = [];
            var length = input.length;

            for (var i = 0; i < length; i++) {
                if (angular.isUndefined(input[i].visible) || input[i].visible) {
                    data.push(input[i]);
                }
            }
            return data;
        };
    }

    function GreaterThanOrEqualToFilter(filterFilter) {
        return function(input, minValue) {
            return filterFilter(input, minValue, function(actual, expected) {
                var isNumber = function(value) {
                    return !isNaN(parseFloat(value));
                };

                if (isNumber(actual) && isNumber(expected)) {
                    return actual >= expected;
                }

                return false;
            });
        };
    }

    function LessThanOrEqualToFilter(filterFilter) {
        return function(input, minValue) {
            return filterFilter(input, minValue, function(actual, expected) {
                var isNumber = function(value) {
                    return !isNaN(parseFloat(value));
                };

                if (isNumber(actual) && isNumber(expected)) {
                    return actual <= expected;
                }

                return false;
            });
        };
    }

    function NaturalFilter($parse, naturalService) {
        var slice = [].slice;

        function toBoolean(value) {
            if (typeof value === 'function') {
                value = true;
            } else if (value && value.length !== 0) {
                var v = angular.lowercase("" + value);
                value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
            } else {
                value = false;
            }
            return value;
        }

        function isWindow(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        }

        function map(obj, iterator, context) {
            var results = [];
            angular.forEach(obj, function (value, index, list) {
                results.push(iterator.call(context, value, index, list));
            });
            return results;
        }

        function isArrayLike(obj) {
            if (obj === null || isWindow(obj)) {
                return false;
            }

            var length = obj.length;

            if (obj.nodeType === 1 && length) {
                return true;
            }

            return angular.isString(obj) || angular.isArray(obj) || length === 0 ||
                typeof length === 'number' && length > 0 && (length - 1) in obj;
        }


        return function (array, sortPredicate, reverseOrder) {
            if (!(isArrayLike(array))) return array;
            sortPredicate = angular.isArray(sortPredicate) ? sortPredicate : [sortPredicate];
            if (sortPredicate.length === 0) {
                sortPredicate = ['+'];
            }
            sortPredicate = map(sortPredicate, function (predicate) {
                var descending = false, get = predicate || identity;
                if (angular.isString(predicate)) {
                    if ((predicate.charAt(0) == '+' || predicate.charAt(0) == '-')) {
                        descending = predicate.charAt(0) == '-';
                        predicate = predicate.substring(1);
                    }
                    if (predicate === '') {
                        // Effectively no predicate was passed so we compare identity
                        return reverseComparator(function (a, b) {
                            return compare(a, b);
                        }, descending);
                    }
                    get = $parse(predicate);
                    if (get.constant) {
                        var key = get();
                        return reverseComparator(function (a, b) {
                            return compare(a[key], b[key]);
                        }, descending);
                    }
                }
                return reverseComparator(function (a, b) {
                    return compare(get(a), get(b));
                }, descending);
            });
            return slice.call(array).sort(reverseComparator(comparator, reverseOrder));

            function comparator(o1, o2) {
                for (var i = 0; i < sortPredicate.length; i++) {
                    var comp = sortPredicate[i](o1, o2);
                    if (comp !== 0) return comp;
                }
                return 0;
            }

            function reverseComparator(comp, descending) {
                return toBoolean(descending) ? function (a, b) {
                    return comp(b, a);
                } : comp;
            }

            function compare(v1, v2) {
                var t1 = typeof v1;
                var t2 = typeof v2;
                if (t1 == t2) {
                    if (angular.isDate(v1) && angular.isDate(v2)) {
                        v1 = v1.valueOf();
                        v2 = v2.valueOf();
                    }
                    if (t1 == "string") {
                        v1 = naturalService.naturalValue(v1.toLowerCase());
                        v2 = naturalService.naturalValue(v2.toLowerCase());
                    }
                    if (v1 === v2) return 0;
                    return v1 < v2 ? -1 : 1;
                } else {
                    return t1 < t2 ? -1 : 1;
                }
            }
        };
    }

    angular.module('ht.tables', ['ui.bootstrap', 'naturalSort', 'ngSanitize', 'ngCsv'])
        .directive('htTable', htTableDirective)
        .directive('htFocus', htFocusDirective)
        .filter('greaterThanOrEqualTo', GreaterThanOrEqualToFilter)
        .filter('lessThanOrEqualTo', LessThanOrEqualToFilter)
        .filter('natural', NaturalFilter)
        .filter('field', FieldFilter);
})();