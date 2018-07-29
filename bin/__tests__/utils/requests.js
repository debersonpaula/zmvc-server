"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var urlTool = require("url");
function get(url) {
    return new Promise(function (resolve, reject) {
        var request = http.get(url, function (resp) {
            var data = '';
            resp.on('data', function (chunk) {
                data += chunk;
            });
            resp.on('end', function () {
                resolve({
                    data: JSON.parse(data),
                    status: resp.statusCode || 0,
                });
            });
        });
        request.on("error", function (err) {
            reject(err);
        });
    });
}
exports.get = get;
function post(url, data) {
    return new Promise(function (resolve, reject) {
        var _a = urlTool.parse(url), hostname = _a.hostname, path = _a.path, port = _a.port;
        var reqOpt = {
            hostname: hostname, path: path, port: port,
            method: 'POST',
            headers: { "content-type": "application/json" }
        };
        var request = http.request(reqOpt, function (resp) {
            var data = '';
            resp.setEncoding('utf8');
            resp.on('data', function (chunk) {
                data += chunk;
            });
            resp.on('end', function () {
                resolve({
                    data: JSON.parse(data),
                    status: resp.statusCode || 0,
                });
            });
        });
        request.on("error", function (err) {
            reject(err);
        });
        request.write(JSON.stringify(data));
        request.end();
    });
}
exports.post = post;
