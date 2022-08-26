import Filter from 'sap/ui/model/Filter';
import Context from 'sap/ui/model/Context';
import Controller from 'sap/ui/core/mvc/Controller';
import ODataModel from 'sap/ui/model/odata/v2/ODataModel';
import JSONModel from 'sap/ui/model/json/JSONModel';
import ResourceModel from 'sap/ui/model/resource/ResourceModel';
import MessageBox, { Action } from 'sap/m/MessageBox';
import Component from 'sap/ui/core/Component';
import ResourceBundle from 'sap/base/i18n/ResourceBundle';
import Router from 'sap/m/routing/Router';
import { User } from './types';

/**
 * @namespace UI5BaseController
 */

export default class BaseController extends Controller {
    private baseModel!: string;
    private currentUser: User;

    constructor(model: string) {
        super('Base');
        this.baseModel = model;
    }

    public getODataModel(id: string = this.baseModel): ODataModel {
        if (id === '') {
            return this.getComponent().getModel() as unknown as ODataModel;
        } else {
            return this.getComponent().getModel(id) as unknown as ODataModel;
        }
    }

    public getJSONModel(id: string = this.baseModel): JSONModel {
        return this.getComponent().getModel(id) as unknown as JSONModel;
    }

    public getText(id: string): string {
        const resourceBundle = (this.getComponent().getModel('i18n') as unknown as ResourceModel).getResourceBundle() as ResourceBundle;
        return resourceBundle.getText(id);
    }

    public getComponent(): Component {
        return this.getOwnerComponent() as unknown as Component;
    }

    public getRouter(): Router {
        return (this.getOwnerComponent() as any).getRouter();
    }

    public byId<T>(id: string): T {
        return this.getView().byId(id) as unknown as T;
    }

    public getStateModel(): JSONModel {
        return this.getJSONModel('state');
    }

    public initialize(): void {
        this.getView().addStyleClass(this.getContentDensityClass());
    }

    public getContentDensityClass(): string {
        return 'sapUiSizeCozy';
    }

    public async quicksave(): Promise<void> {
        await this.submit(this.baseModel);
    }

    public clearMessageManager(): void {
        sap.ui.getCore().getMessageManager().removeAllMessages();
    }

    public async confirm(textId = 'confirmDelete', titleTextId?: string): Promise<boolean> {
        return new Promise((resolve, _) => {
            MessageBox.confirm(this.getText(textId), {
                onClose: (closeAction: Action) => {
                    resolve(closeAction === Action.OK);
                },
                title: titleTextId ? this.getText(titleTextId!) : undefined
            });
        });
    }

    public async remove(path: string, model = this.baseModel): Promise<void> {
        return new Promise((resolve, reject) => {
            const onCompleted = (event: any) => {
                this.getODataModel(model).detachRequestCompleted(onCompleted);

                if (event.getParameter('success') === false) {
                    reject();
                } else {
                    resolve();
                }
            };

            const onFailed = (err: any) => {
                this.getODataModel(model).detachRequestFailed(onFailed);
                reject(err);
            };

            this.getODataModel(model).attachRequestCompleted(onCompleted);
            this.getODataModel(model).attachRequestFailed(onFailed);
            this.getODataModel(model).remove(path);
        });
    }

    public async submit(model = this.baseModel, refresh = true): Promise<void> {
        const defaultRefreshBehavior = this.getODataModel(model).getRefreshAfterChange();
        this.getODataModel(model).setRefreshAfterChange(refresh);

        if (!this.getODataModel(model).hasPendingChanges(true)) {
            return;
        }

        return new Promise((resolve, reject) => {
            const onCompleted = (event: any) => {
                this.getODataModel(model).detachRequestCompleted(onCompleted);
                this.getODataModel(model).setRefreshAfterChange(defaultRefreshBehavior);

                if (event.getParameter('success') === false) {
                    reject();
                } else {
                    resolve();
                }
            };

            const onFailed = (err: any) => {
                this.getODataModel(model).detachRequestFailed(onFailed);
                this.getODataModel(model).setRefreshAfterChange(defaultRefreshBehavior);

                reject(err);
            };

            this.getODataModel(model).attachRequestCompleted(onCompleted);
            this.getODataModel(model).attachRequestFailed(onFailed);
            this.getODataModel(model).submitChanges();
        });
    }

    public async query<T>(entitySet: string, filters: Filter[] = [], model = this.baseModel): Promise<T> {
        return new Promise((resolve, reject) => {
            this.getODataModel(model).read(entitySet, {
                success: (oData: any) => {
                    resolve(oData.results);
                },
                error: (err: any) => {
                    reject(err);
                },
                filters
            });
        });
    }

    public async reset(model = this.baseModel): Promise<void> {
        await this.getODataModel(model).resetChanges();
    }

    public toggleBusy() {
        const busy = this.getStateModel().getProperty('/busy');
        this.getStateModel().setProperty('/busy', !busy);
    }

    public async read<T>(entitySet: string, primaryKey: Object, model = this.baseModel): Promise<T> {
        const pathWithKeys =
            entitySet +
            `(${Object.keys(primaryKey)
                .map(key => {
                    const keyString = primaryKey[key as keyof Object] as unknown as string;
                    return typeof primaryKey[key as keyof Object] === 'number' ? `${key}=${encodeURIComponent(keyString)}` : `${key}='${encodeURIComponent(keyString)}'`;
                })
                .join(',')})`;

        return new Promise((resolve, reject) => {
            this.getODataModel(model).read(pathWithKeys, {
                success: (oData: any) => {
                    resolve(oData.result || oData);
                },
                error: (err: any) => {
                    reject(err);
                }
            });
        });
    }

    public createEntry(path: string, model: string = this.baseModel, properties: Object = {}): Context {
        return this.getODataModel(model).createEntry(path, { properties }) as unknown as Context;
    }

    public async create<T>(path: string, properties: Object, model: string = this.baseModel): Promise<T> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(model).create(path, properties, {
                success: (oData: any) => {
                    resolve(oData);
                },
                error: () => {
                    reject();
                }
            });
        });
    }

    public isOnline(): boolean {
        return window.navigator.onLine;
    }

    public async getCurrentUser(): Promise<User> {
        if (!this.currentUser) {
            const response = await fetch('/sap/bc/ui2/start_up');
            this.currentUser = await response.json();
        }

        return this.currentUser;
    }
}
