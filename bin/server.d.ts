/// <reference types="node" />
import { ServerResponse } from 'http';
export interface IResponse extends ServerResponse {
    sendJSON: (status: number, data: any) => void;
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
}
export declare class ZMVCServer {
    private _server;
    private _mvc;
    constructor();
    /**
     * Start server action and listen to the specified port
     * @param port Specified Port
     * @param callback Executed if success or fail
     */
    listen(port: number, callback?: Function): void;
    /**
     * Stop the server action
     * @param callback
     */
    stop(callback?: Function): void;
    private _requestListener;
    private _executeRoutes;
    /**
     * Get MVC Object
     */
    readonly mvc: TMVC;
}
export declare class TMVC {
    protected _controller: TControllers;
    protected _model: TModels;
    protected _view: TViews;
    constructor();
    readonly controller: TControllers;
    readonly model: TModels;
    readonly view: TViews;
}
export declare class TList<ListType> {
    protected _list: {
        [key: string]: ListType;
    };
    constructor();
    protected _add(name: string, data: ListType): ListType;
    items(name: string): ListType | undefined;
    readonly count: number;
}
export declare class TControllers extends TList<TController> {
    private _mvc;
    constructor(mvcOwner: TMVC);
    add(method: string, path: string, model?: string, view?: string): TController;
    get(path: string, model?: string, view?: string): TController;
    post(path: string, model?: string, view?: string): TController;
}
export declare class TController {
    private _owner;
    private _model?;
    private _view?;
    private _name;
    constructor(owner: TControllers, name: string, model?: IModel, view?: IView);
    add(method: string, path: string, model?: string, view?: string): TController;
    get(path: string, model?: string, view?: string): TController;
    post(path: string, model?: string, view?: string): TController;
    exec(request: IRequest): Promise<any>;
}
export declare class TModels extends TList<IModel> {
    add(name: string, data: IModel): IModel;
}
export interface IModel {
    handler: (request: IRequest) => Promise<any>;
}
export declare class TViews extends TList<IView> {
    add(name: string, data: IView): IView;
}
export interface IView {
    handler: (data: any, request: IRequest) => any;
}
