import * as http from 'http';
import { RequestOptions } from 'http';
import * as urlTool from 'url';

interface RequestResponse {
    data: any;
    status: number;
}

export function get(url: string): Promise<any> {
    return new Promise<RequestResponse>((resolve, reject) => {
        const request = http.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                resolve({
                    data: JSON.parse(data),
                    status: resp.statusCode || 0,
                });
            });
        });

        request.on("error", (err) => {
            reject(err);
        });
    });
}

export function post(url: string, data: any): Promise<any> {
    return new Promise<RequestResponse>((resolve, reject) => {
        const { hostname, path, port } = urlTool.parse(url);
        const reqOpt: RequestOptions = {
            hostname, path, port,
            method: 'POST',
            headers: { "content-type": "application/json" }
        }
        const request = http.request(reqOpt, (resp) => {
            let data = '';
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve({
                    data: JSON.parse(data),
                    status: resp.statusCode || 0,
                });
            });
        });

        request.on("error", (err) => {
            reject(err);
        });

        request.write(JSON.stringify(data));
        request.end();
    });
}