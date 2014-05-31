'use strict';

angular.module('ffffng')
.directive('fNodeForm', function () {
    var ctrl = function ($scope, $timeout, Constraints, Validator, _, config, $window) {
        $scope.config = config;
        angular.extend($scope, {
            center: {
                lat: config.coordsSelector.lat,
                lng: config.coordsSelector.lng,
                zoom: config.coordsSelector.defaultZoom
            },
            markers: {},
            layers: {
                baselayers: {
                    osm: {
                        name: '',
                        url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg',
                        type: 'xyz',
                        layerOptions: {
                            subdomains: '1234',
                            attribution:
                                'Map data Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> ' +
                                '<img src="http://developer.mapquest.com/content/osm/mq_logo.png" />, ' +
                                'Map data © OpenStreetMap contributors, CC-BY-SA'
                        }
                    }
                }
            }
        });

        var updateNodePosition = function (lat, lng) {
            $scope.markers.node = {
                lat: lat,
                lng: lng,
                focus: true,
                draggable: false
            };
        };

        $scope.$on('leafletDirectiveMap.click', function (event, leaflet) {
            var lat = leaflet.leafletEvent.latlng.lat;
            var lng = leaflet.leafletEvent.latlng.lng;
            updateNodePosition(lat, lng);
            $scope.node.coords = lat + ' ' + lng;
        });

        function withValidCoords(coords, callback) {
            coords = coords ||  '';
            coords = coords.trim();
            if (_.isEmpty(coords)) {
                return;
            }

            if ($scope.hasError('coords')) {
                return;
            }

            var parts = coords.split(/\s+/);

            var lat = Number(parts[0]);
            var lng = Number(parts[1]);

            callback(lat, lng);
        }

        $scope.updateMap = function (optCoords) {
            var coords = optCoords || $scope.coords;
            withValidCoords(coords, function (lat, lng) {
                updateNodePosition(lat, lng);
            });
        };

        $scope.resetCoords = function () {
            $scope.node.coords = '';
            $scope.markers = {};
        };

        var isValid = _.reduce(Constraints.node, function (isValids, constraint, field) {
            isValids[field] = Validator.forConstraint(constraint, true);
            return isValids;
        }, {});
        var areValid = Validator.forConstraints(Constraints.node);

        $scope.hasError = function (field) {
            var value = $scope.node[field];
            return !isValid[field](value);
        };

        $scope.hasAnyError = function () {
            return !areValid($scope.node);
        };

        var duplicateError = {
            hostname: 'Der Knotenname ist bereits vergeben. Bitte wähle einen anderen.',
            key: 'Für den VPN-Schlüssel gibt es bereits einen Eintrag.',
            mac: 'Für die MAC-Adresse gibt es bereits einen Eintrag.'
        };

        $scope.onSubmit = function (node) {
            $scope.error = null;
            $scope.save(node).error(function (response, code) {
                switch (code) {
                    case 409: // conflict
                        $scope.error = duplicateError[response.field];
                        break;
                    default:
                        $scope.error = 'Es ist ein Fehler aufgetreten. Versuche es später noch einmal.';
                }
                $window.scrollTo(0, 0);
            });
        };

        $scope.updateMap($scope.node.coords);
        withValidCoords($scope.node.coords, function (lat, lng) {
            $scope.center.lat = lat;
            $scope.center.lng = lng;
            $scope.center.zoom = 12;
        });
    };

    return {
        'controller': ctrl,
        'restrict': 'E',
        'templateUrl': 'views/directives/nodeForm.html',
        'scope': {
            'node': '=fNode',
            'save': '=fSave',
            'cancel': '=fCancel',
            'action': '@fAction'
        }
    };
});
