"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var urlTool = require("url");
var querystring = require("querystring");
var ZMVCServer = /** @class */ (function () {
    function ZMVCServer() {
        this._mvc = new TMVC();
        this._server = http.createServer(this._requestListener.bind(this));
    }
    /**
     * Start server action and listen to the specified port
     * @param port Specified Port
     * @param callback Executed if success or fail
     */
    ZMVCServer.prototype.listen = function (port, callback) {
        this._server.listen(port);
        this._server.on('error', function (e) {
            callback && callback(e);
        });
        this._server.on('listening', function () {
            callback && callback();
        });
    };
    /**
     * Stop the server action
     * @param callback
     */
    ZMVCServer.prototype.stop = function (callback) {
        this._server.close(callback);
    };
    ZMVCServer.prototype._requestListener = function (req, res) {
        var _this = this;
        var method = req.method, url = req.url, headers = req.headers;
        var baseURL = url;
        var _a = urlTool.parse(baseURL), query = _a.query, pathname = _a.pathname;
        var queryData = querystring.parse(query || '');
        // attach handlers
        res.sendJSON = function (status, data) {
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(data));
            res.end();
        };
        // execute routes
        var bodyStr = '';
        req.on('data', function (data) {
            bodyStr += data;
            // to avoid flood atack
            if (bodyStr.length > 1e6) {
                req.connection.destroy();
            }
        });
        req.on('end', function () {
            var body = bodyStr ? JSON.parse(bodyStr) : {};
            _this._executeRoutes(res, {
                method: method,
                route: pathname,
                headers: headers,
                query: queryData,
                body: body,
            });
        });
    };
    ZMVCServer.prototype._executeRoutes = function (res, request) {
        var route = request.route, method = request.method;
        if (this._mvc.controller.count) {
            var controller = this._mvc.controller.items(method + ":" + route);
            if (controller) {
                controller.exec(request).then(function (data) {
                    res.sendJSON(200, data);
                }).catch(function (error) {
                    res.sendJSON(500, error);
                });
            }
            else {
                res.sendJSON(404, { error: "Route " + method + ":" + route + " does not exists." });
            }
        }
        else {
            res.sendJSON(500, { error: 'Route list is empty.' });
        }
    };
    Object.defineProperty(ZMVCServer.prototype, "mvc", {
        /**
         * Get MVC Object
         */
        get: function () {
            return this._mvc;
        },
        enumerable: true,
        configurable: true
    });
    return ZMVCServer;
}());
exports.ZMVCServer = ZMVCServer;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
var TMVC = /** @class */ (function () {
    function TMVC() {
        this._controller = new TControllers(this);
        this._model = new TModels();
        this._view = new TViews();
    }
    Object.defineProperty(TMVC.prototype, "controller", {
        get: function () {
            return this._controller;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TMVC.prototype, "model", {
        get: function () {
            return this._model;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TMVC.prototype, "view", {
        get: function () {
            return this._view;
        },
        enumerable: true,
        configurable: true
    });
    return TMVC;
}());
exports.TMVC = TMVC;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
var TList = /** @class */ (function () {
    function TList() {
        this._list = {};
    }
    TList.prototype._add = function (name, data) {
        this._list[name] = data;
        return this._list[name];
    };
    TList.prototype.items = function (name) {
        return this._list[name] || undefined;
    };
    Object.defineProperty(TList.prototype, "count", {
        get: function () {
            return Object.keys(this._list).length;
        },
        enumerable: true,
        configurable: true
    });
    return TList;
}());
exports.TList = TList;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
var TControllers = /** @class */ (function (_super) {
    __extends(TControllers, _super);
    function TControllers(mvcOwner) {
        var _this = _super.call(this) || this;
        _this._mvc = mvcOwner;
        return _this;
    }
    TControllers.prototype.add = function (method, path, model, view) {
        var route = "" + path;
        var getModel = this._mvc.model.items(model || '');
        var getView = this._mvc.view.items(view || '');
        var item = new TController(this, route, getModel, getView);
        this._add(method + ":" + route, item);
        return item;
    };
    TControllers.prototype.get = function (path, model, view) {
        return this.add('GET', path, model, view);
    };
    TControllers.prototype.post = function (path, model, view) {
        return this.add('POST', path, model, view);
    };
    return TControllers;
}(TList));
exports.TControllers = TControllers;
var TController = /** @class */ (function () {
    function TController(owner, name, model, view) {
        this._owner = owner;
        this._name = name;
        this._model = model;
        this._view = view;
    }
    TController.prototype.add = function (method, path, model, view) {
        var route = "" + this._name + path;
        return this._owner.add(method, route, model, view);
    };
    TController.prototype.get = function (path, model, view) {
        return this.add('GET', path, model, view);
    };
    TController.prototype.post = function (path, model, view) {
        return this.add('POST', path, model, view);
    };
    TController.prototype.exec = function (request) {
        var view = this._view, model = this._model;
        if (view && model) {
            return model.handler(request).then(function (data) {
                return view.handler(data, request);
            });
        }
        else if (!view && model) {
            return model.handler(request);
        }
        else {
            return Promise.reject({ error: 'view and model not defined for this route' });
        }
    };
    return TController;
}());
exports.TController = TController;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
var TModels = /** @class */ (function (_super) {
    __extends(TModels, _super);
    function TModels() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TModels.prototype.add = function (name, data) {
        return this._add(name, data);
    };
    return TModels;
}(TList));
exports.TModels = TModels;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
var TViews = /** @class */ (function (_super) {
    __extends(TViews, _super);
    function TViews() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TViews.prototype.add = function (name, data) {
        return this._add(name, data);
    };
    return TViews;
}(TList));
exports.TViews = TViews;
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/ 
