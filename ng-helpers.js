var angularHelpers = angular.module('angular.helpers', []);

angularHelpers.service('$helpers', function() {

    var _this = this;

    this.mixin = function (obj, keypath, val) {
        var key = keypath.match(/^[^.]+/)[0];
        if (key == keypath) {
            obj[key] = typeof val == 'function' ? val(obj[key]) : val;
        } else {
            if (!obj[key]) {
                obj[key] = {};
            }
            return _this.mixin(obj[key], keypath.substr(key.length + 1), val);
        }
        return obj[key]
    };

    /**
     * Ensure that object is an array
     * 
     * @function
     * @param scope
     * @param path
     * @param length
     */
    this.ensureArray = function(scope, path, length) {
        var result = _this.mixin(scope, path, function (val) {
            if (!val && !(val instanceof Array)) {
                return []
            } else {
                return val
            }
        });
        while (result.length < length) {
            result.push({})
        }
        return result;
    };

    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

    /**
     * Sort external array by rule
     *
     * @param external_array
     * @param sort_keypath sort field
     * @param rule 1 (asc, default), -1 (desc), [1,2,3,4,..] - array to compare
     */
    this.sortExternalArray = function (external_array, sort_keypath, rule) {

        if(typeof rule == 'object' && !rule._sortExternalArray_rule_id) {
            Object.defineProperty(rule, '_sortExternalArray_rule_id', { enumerable: false, value: Math.random(), writable: true });
        }

        if(!rule) {
            rule = [];
        }

        if(external_array) {

            if(!external_array['_sortExternalArray' + sort_keypath  + rule._sortExternalArray_rule_id]) {
                Object.defineProperty(external_array, '_sortExternalArray' + sort_keypath  + rule._sortExternalArray_rule_id,
                    { enumerable: false, value: [], writable: true });
            }

            var linkedArray = external_array['_sortExternalArray' + sort_keypath  + rule._sortExternalArray_rule_id];

            [].concat(external_array).concat(linkedArray).map(function(it) {
                if(linkedArray.indexOf(it) == -1) {
                    linkedArray.push(it);
                }
                if(external_array.indexOf(it) == -1) {
                    linkedArray.splice(linkedArray.indexOf(it), 1);
                }
            });

            linkedArray.sort(function (a, b) {
                var ap = _this.get_by_path(a, sort_keypath);
                var bp = _this.get_by_path(b, sort_keypath);
                if (!rule || rule == 1) {
                    if (ap > bp) return 1;
                    if (ap < bp) return -1;
                    return 0
                } else if (rule == -1) {
                    if (ap > bp) return -1;
                    if (ap < bp) return 1;
                    return 0
                } else if (rule instanceof Array) {
                    var ax = rule.indexOf(ap) + 1 || rule.length + 1;
                    var bx = rule.indexOf(bp) + 1 || rule.length + 1;
                    if (ax > bx) return 1;
                    if (ax < bx) return -1;
                    if (ax == bx) {
                        if(external_array.indexOf(a) > external_array.indexOf(b)) {
                            return 1;
                        }
                        if(external_array.indexOf(a) < external_array.indexOf(b)) {
                            return -1;
                        }
                    }
                    return 0;
                } else {
                    throw new Error('Undefined external sort rule' + rule);
                }
            });
            //rule.splice(0);
            //linkedArray.map(function(it) {
            //    rule.push(get_by_path(it, sort_keypath));
            //});
        }
        return linkedArray;
    };

    /**
     *  Get data by path
     *  @function
     *
     *  @param obj
     *  @param keypath
     *
     *  @returns {*}
     */
    this.get_by_path = function(obj, keypath) {
        var key = keypath.match(/^[^.]+/)[0];
        if(key == keypath) {
            return obj[key];
        } else {
            if(!obj[key]) { return obj[key] }
            return _this.get_by_path(obj[key], keypath.substr(key.length + 1));
        }
    };
});

angularHelpers.directive('injectHelpers', function() {
    return {
        restrict: 'A',
        link: function (scope, el) {

            scope.console = console;

            scope.helpers = {
                focus: function(selector) {
                    $($(selector)[0]).focus();
                    setTimeout(function() {
                        $($(selector)[0]).focus();
                    }, 0);
                },
                focusAndSelect: function(selector, timeout) {
                    $($(selector)[0]).focus().select();
                    setTimeout(function() {
                        $($(selector)[0]).focus().select();
                    }, timeout || 0);
                },
                scrollIntoView: function(selector) {
                    setTimeout(function() {
                       $(selector).each(function() {
                           this.scrollIntoViewIfNeeded();
                       })
                    }, 0);
                },
                scrollEndH: function(selector) {
                    setTimeout(function() {
                       $(selector).each(function() {
                           this.scrollLeft = 10000000;
                       })
                    }, 0);
                },
                scrollPageLeft: function(selector) {
                    setTimeout(function() {
                       $(selector).each(function() {
                           this.scrollLeft -= this.clientWidth;
                       })
                    }, 0);
                },
                scrollPageRight: function(selector) {
                    setTimeout(function() {
                       $(selector).each(function() {
                           this.scrollLeft += this.clientWidth;
                       })
                    }, 0);
                },
                isScrollable: function(selector) {
                    var node = $(selector)[0];
                    // optimize getting sizing properties, it is important for performance
                    if(node && !node.hasOwnProperty('scrollable')) {
                        if(!node.bypass_apply) {
                            updateScrollable(node);
                        }
                        node.bypass_apply = false
                    } else {
                        if(node.scrollable_interval) {
                            clearTimeout(node.scrollable_interval);
                            delete node.scrollable_interval;
                        } else {
                            if(!node.bypass_apply) {
                                updateScrollable(node);
                            }
                            node.bypass_apply = false
                        }
                        node.scrollable_interval = setTimeout(function() {
                            if(!node.bypass_apply) {
                                updateScrollable(node);
                            }
                            node.bypass_apply = false
                        }, 250);
                    }
                    return node.scrollable;
                },
                isScrollableToLeft: function(selector) {
                    var node = $(selector)[0];
                    return node.scrollLeft > 0;
                },
                isScrollableToRight: function(selector) {
                    var node = $(selector)[0];
                    return node.clientWidth + node.scrollLeft < node.scrollWidth;
                },
                removeClass: function(classname, selector) {
                    $(selector).removeClass(classname);
                },
                timeoutAndEval: function(timeout, fn) {
                    setTimeout(function() {
                        scope.$eval(fn);
                        scope.$$phase || scope.$apply();
                    }, timeout);
                },
                isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints /* IE10/11 & Surface */ ? 1 : 0
            };

            function updateScrollable(node) {
                var oldscr = node.scrollable;
                node.scrollable = node.scrollWidth != node.clientWidth || node.scrollHeight != node.clientHeight;
                if(oldscr != node.scrollable) {
                    if(!scope.$$phase) {
                        node.bypass_apply = true;
                        scope.$apply();
                    }
                }
            }
        }
    }
});