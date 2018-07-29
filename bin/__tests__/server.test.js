"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("../../src/server");
var requests = require("./utils/requests");
var testURL = 'http://localhost:3000';
describe('ZServer component', function () {
    var server;
    it('should create component', function () {
        server = new server_1.ZMVCServer();
        expect(server).toBeTruthy();
    });
    it('should listen to the port 3000', function (done) {
        server.listen(3000, function () {
            done();
        });
    });
    it('should cause error (using port already opened)', function (done) {
        var errorServer = new server_1.ZMVCServer();
        errorServer.listen(3000, function (error) {
            expect(error).toBeDefined();
            done();
        });
    });
    it('should call root route with error', function (done) {
        requests.get(testURL).then(function (response) {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(500);
            done();
        });
    });
    it('should call route with model, views and controller', function (done) {
        var _a = server.mvc, controller = _a.controller, model = _a.model, view = _a.view;
        model.add('testModel', {
            handler: function (params) { return Promise.resolve('testdata'); }
        });
        view.add('testView', {
            handler: function (data, params) { return { list: data }; }
        });
        controller.get('/route1', 'testModel', 'testView');
        requests.get(testURL + '/route1').then(function (response) {
            expect(response.data).toHaveProperty('list');
            expect(response.data.list).toBe('testdata');
            expect(response.status).toBe(200);
            expect(model.count).toBe(1);
            expect(view.count).toBe(1);
            done();
        });
    });
    it('should call route with controller and without view and model', function (done) {
        var controller = server.mvc.controller;
        controller.get('/route2');
        requests.get(testURL + '/route2').then(function (response) {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(500);
            done();
        });
    });
    it('should call route with controller and with only model', function (done) {
        var _a = server.mvc, controller = _a.controller, model = _a.model, view = _a.view;
        controller.get('/route3', 'testModel');
        requests.get(testURL + '/route3').then(function (response) {
            expect(response.data).toBe('testdata');
            expect(response.status).toBe(200);
            done();
        });
    });
    it('should call sub-route', function (done) {
        var _a = server.mvc, controller = _a.controller, model = _a.model, view = _a.view;
        var route = controller.get('/route4');
        route.get('/sub', 'testModel');
        requests.get(testURL + '/route4/sub').then(function (response) {
            expect(response.data).toBe('testdata');
            expect(response.status).toBe(200);
            done();
        });
    });
    it('should call wrong route', function (done) {
        requests.get(testURL + '/wrong').then(function (response) {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(404);
            done();
        });
    });
    it('should create controller with existent name', function (done) {
        var controller = server.mvc.controller;
        controller.get('route2');
        done();
    });
    it('should create route for POST action', function (done) {
        var _a = server.mvc, controller = _a.controller, model = _a.model, view = _a.view;
        model.add('postModel', {
            handler: function (requests) { return Promise.resolve(requests); }
        });
        controller.post('/route4', 'postModel');
        requests.post(testURL + '/route4', { data: 'postdata' }).then(function (response) {
            expect(response.data).toHaveProperty('body');
            expect(response.data).toHaveProperty('headers');
            expect(response.data).toHaveProperty('method');
            done();
        });
    });
    it('should stop the server', function (done) {
        server.stop(function () {
            done();
        });
    });
});
