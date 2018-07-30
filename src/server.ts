import * as http from 'http';
import * as urlTool from 'url';
import * as querystring from 'querystring';
import { ServerResponse } from 'http';
import { request } from 'https';

export interface IResponse extends ServerResponse {
    sendJSON: (status: number, data: any) => void
}
/**
 * Used as object for any requests
 */
export interface IRequest {
    route?: string;
    method?: string;
    query?: any;
    headers?: any;
    body?: any;
    data?: any;
}

export class ZMVCServer {
    private _server: http.Server;
    private _mvc: TMVC;

    constructor() {
        this._mvc = new TMVC();
        this._server = http.createServer(this._requestListener.bind(this));
    }

    /**
     * Start server action and listen to the specified port
     * @param port Specified Port
     * @param callback Executed if success or fail
     */
    public listen(port: number, callback?: Function) {
        this._server.listen(port);
        this._server.on('error', (e) => {
            callback && callback(e);
        });
        this._server.on('listening', () => {
            callback && callback();
        });
    }

    /**
     * Stop the server action
     * @param callback
     */
    public stop(callback?: Function) {
        this._server.close(callback);
    }

    private _requestListener(req: http.IncomingMessage, res: IResponse) {
        const { method, url, headers } = req;
        const baseURL: any = url;
        const { query, pathname } = urlTool.parse(baseURL);


        const queryData = querystring.parse(query || '');
        // attach handlers
        res.sendJSON = (status: number, data: any) => {
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(data));
            res.end();
        };
        // execute routes
        let bodyStr = '';
        req.on('data', (data) => {
            bodyStr += data;
            // to avoid flood atack
            if (bodyStr.length > 1e6) {
                req.connection.destroy();
            }
        });
        req.on('end', () => {
            const body = bodyStr ? JSON.parse(bodyStr) : {};
            this._executeRoutes(res, {
                method,
                route: pathname,
                headers,
                query: queryData,
                body,
            });

        });

    }

    private _executeRoutes(res: IResponse, req: IRequest) {
        const { route, method } = req;
        if (this._mvc.controller.count) {
            const controller = this._mvc.controller.items(`${method}:${route}`);
            if (controller) {
                controller.middlewares.exec(req, res, (request) => {
                    controller.exec(request).then(data => {
                        res.sendJSON(200, data);
                    }).catch(error => {
                        res.sendJSON(500, error);
                    })
                });
            } else {
                res.sendJSON(404, { error: `Route ${method}:${route} does not exists.` });
            }
        } else {
            res.sendJSON(500, { error: 'Route list is empty.' });
        }
    }

    /**
     * Get MVC Object
     */
    public get mvc(): TMVC {
        return this._mvc;
    }
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TMVC {
    protected _controller: TControllers;
    protected _model: TModels;
    protected _view: TViews;
    constructor() {
        this._controller = new TControllers(this);
        this._model = new TModels();
        this._view = new TViews();
    }
    get controller(): TControllers {
        return this._controller;
    }
    get model(): TModels {
        return this._model;
    }
    get view(): TViews {
        return this._view;
    }
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TList<ListType> {
    protected _list: {
        [key: string]: ListType
    };
    constructor() {
        this._list = {};
    }
    protected _add(name: string, data: ListType): ListType {
        this._list[name] = data;
        return this._list[name];
    }
    public items(name: string): ListType | undefined {
        return this._list[name] || undefined;
    }
    public get count(): number {
        return Object.keys(this._list).length;
    }
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TControllers extends TList<TController> {
    private _mvc: TMVC;
    constructor(mvcOwner: TMVC) {
        super();
        this._mvc = mvcOwner;
    }
    public add(method: string, path: string, model?: string, view?: string, middlewares?: TMiddlewares): TController {
        const route = `${path}`;
        const getModel = this._mvc.model.items(model || '');
        const getView = this._mvc.view.items(view || '');
        const item = new TController(this, route, getModel, getView, middlewares);
        this._add(`${method}:${route}`, item);
        return item;
    }
    public get(path: string, model?: string, view?: string): TController {
        return this.add('GET', path, model, view);
    }
    public post(path: string, model?: string, view?: string): TController {
        return this.add('POST', path, model, view);
    }
}
export class TController {
    private _owner: TControllers;
    private _model?: IModel;
    private _view?: IView;
    private _middlewares: TMiddlewares;
    private _name: string;
    /**
     * Instantiate TController component
     * @param owner Object that holds controllers
     * @param name Name of Controller, also hold the route that calls the controller
     * @param model Data Model
     * @param view Data Serialization
     * @param middleware
     */
    constructor(owner: TControllers, name: string, model?: IModel, view?: IView, middlewares?: TMiddlewares) {
        this._owner = owner;
        this._name = name;
        this._model = model;
        this._view = view;
        this._middlewares = new TMiddlewares;
        if (middlewares) {
            this._middlewares.list = this._middlewares.list.concat(middlewares.list);
        }
    }
    public add(method: string, path: string, model?: string, view?: string): TController {
        const route = `${this._name}${path}`;
        return this._owner.add(method, route, model, view, this._middlewares);
    }
    public get(path: string, model?: string, view?: string): TController {
        return this.add('GET', path, model, view);
    }
    public post(path: string, model?: string, view?: string): TController {
        return this.add('POST', path, model, view);
    }
    public exec(request: IRequest): Promise<any> {
        const view = this._view, model = this._model;
        if (view && model) {
            return model.handler(request).then(data => {
                return view.handler(data, request);
            });
        } else if (!view && model) {
            return model.handler(request);
        } else {
            return Promise.reject({ error: 'view and model not defined for this route' });
        }
    }
    public get middlewares(): TMiddlewares {
        return this._middlewares;
    }
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TModels extends TList<IModel> {
    public add(name: string, data: IModel): IModel {
        return this._add(name, data);
    }
}
export interface IModel {
    handler: (request: IRequest) => Promise<any>;
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TViews extends TList<IView> {
    public add(name: string, data: IView): IView {
        return this._add(name, data);
    }
}
export interface IView {
    handler: (data: any, request: IRequest) => any;
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/
export class TMiddlewares {
    public list: IMiddleware[] = [];
    public add(data: IMiddleware) {
        this.list.unshift(data);
    }
    public exec(request: IRequest, response: IResponse, callback: (request: IRequest) => void) {
        const count = this.list.length;
        let previous = () => callback(request);
        for (let i = 0; i < count; i++) {
            const next = previous;
            previous = () => {
                this.list[i].handler(request, response, next);
            }
        }
        previous();
    }
}
export interface IMiddleware {
    handler: (request: IRequest, response: IResponse, next: () => void) => void;
}
/*------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------*/