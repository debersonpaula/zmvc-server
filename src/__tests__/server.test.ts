import { ZMVCServer } from '../../src/server';
import * as requests from './utils/requests';
const testURL = 'http://localhost:3000';

describe('ZServer component', () => {

    let server: ZMVCServer;

    it('should create component', () => {
        server = new ZMVCServer();
        expect(server).toBeTruthy();
    });

    it('should listen to the port 3000', (done) => {
        server.listen(3000, () => {
            done();
        })
    });

    it('should cause error (using port already opened)', (done) => {
        const errorServer = new ZMVCServer();
        errorServer.listen(3000, (error: any) => {
            expect(error).toBeDefined();
            done();
        })
    });

    it('should call root route with error', (done) => {
        requests.get(testURL).then(response => {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(500);
            done();
        });
    });

    it('should call route with model, views and controller', (done) => {
        const { controller, model, view } = server.mvc;
        model.add('testModel', {
            handler: (params?: any) => Promise.resolve('testdata')
        });
        view.add('testView', {
            handler: (data: any, params?: any) => { return { list: data } }
        });
        controller.get('/route1', 'testModel', 'testView');
        requests.get(testURL + '/route1').then(response => {
            expect(response.data).toHaveProperty('list');
            expect(response.data.list).toBe('testdata');
            expect(response.status).toBe(200);
            expect(model.count).toBe(1);
            expect(view.count).toBe(1);
            done();
        });
    });

    it('should call route with controller and without view and model', (done) => {
        const { controller } = server.mvc;
        controller.get('/route2');
        requests.get(testURL + '/route2').then(response => {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(500);
            done();
        });
    });

    it('should call route with controller and with only model', (done) => {
        const { controller, model, view } = server.mvc;
        controller.get('/route3', 'testModel');
        requests.get(testURL + '/route3').then(response => {
            expect(response.data).toBe('testdata');
            expect(response.status).toBe(200);
            done();
        });
    });

    it('should call sub-route', (done) => {
        const { controller, model, view } = server.mvc;
        const route = controller.get('/route4');
        route.get('/sub', 'testModel');
        requests.get(testURL + '/route4/sub').then(response => {
            expect(response.data).toBe('testdata');
            expect(response.status).toBe(200);
            done();
        });
    });

    it('should call wrong route', (done) => {
        requests.get(testURL + '/wrong').then(response => {
            expect(response.data).toHaveProperty('error');
            expect(response.status).toBe(404);
            done();
        });
    });

    it('should create controller with existent name', (done) => {
        const { controller } = server.mvc;
        controller.get('route2');
        done();
    });

    it('should create route for POST action', (done) => {
        const { controller, model, view } = server.mvc;
        model.add('postModel', {
            handler: (requests) => Promise.resolve(requests)
        });
        controller.post('/route4', 'postModel');
        requests.post(testURL + '/route4', { data: 'postdata' }).then(response => {
            expect(response.data).toHaveProperty('body');
            expect(response.data).toHaveProperty('headers');
            expect(response.data).toHaveProperty('method');
            done();
        });
    });

    it('should stop the server', (done) => {
        server.stop(() => {
            done();
        })
    });
});