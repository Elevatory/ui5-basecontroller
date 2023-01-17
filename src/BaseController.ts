import Filter from 'sap/ui/model/Filter';
import Context from 'sap/ui/model/Context';
import Controller from 'sap/ui/core/mvc/Controller';
import ODataModel from 'sap/ui/model/odata/v2/ODataModel';
import JSONModel from 'sap/ui/model/json/JSONModel';
import MessageBox, { Action } from 'sap/m/MessageBox';
import Component from 'sap/ui/core/Component';
import Router from 'sap/m/routing/Router';

/**
 * @namespace UI5BaseController
 */

export default class BaseController extends Controller {
    private baseModel!: string;

    constructor(model: string) {
        super('Base');
        this.baseModel = model;
        this.polyfillPromiseAllSettled();
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

    public getText(id: string, ...parameters): string {
        //@ts-ignore
        return this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
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

    public async quicksave(): Promise<void> {
        await this.submit({ modelName: this.baseModel });
    }

    public clearMessageManager(): void {
        sap.ui.getCore().getMessageManager().removeAllMessages();
    }

    public async confirm(textId, titleTextId?: string): Promise<boolean> {
        return new Promise((resolve, _) => {
            MessageBox.confirm(this.getText(textId), {
                onClose: (closeAction: Action) => {
                    resolve(closeAction === Action.OK);
                },
                title: titleTextId ? this.getText(titleTextId!) : undefined
            });
        });
    }

    protected async inform(textId, titleTextId?: string): Promise<void> {
        return await new Promise((resolve, _) => {
            MessageBox.information(this.getText(textId) || textId, {
                onClose: () => {
                    resolve();
                },
                title: titleTextId ? this.getText(titleTextId!) || titleTextId : undefined
            });
        });
    }

    public async showError(error): Promise<void> {
        return await new Promise(resolve => {
            console.error(error);

            MessageBox.error(this.getErrorMessage(error), {
                onClose: () => {
                    resolve();
                }
            });
        });
    }

    public async create<T>({ path, properties, modelName = this.baseModel }: { path: string, properties: Object, modelName?: string }): Promise<T> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).create(path, properties, {
                success: (oData: any) => {
                    resolve(oData);
                },
                error: error => {
                    reject(error);
                }
            });
        });
    }

    public createEntry({ path, modelName = this.baseModel, properties = {} }: { path: string, modelName?: string, properties?: Object }): Context {
        return this.getODataModel(modelName).createEntry(path, { properties }) as unknown as Context;
    }

    public async read<T>({ entitySet, primaryKey, modelName = this.baseModel }: { entitySet: string, primaryKey: Object, modelName?: string }): Promise<T> {
        const pathWithKeys =
            entitySet +
            `(${Object.keys(primaryKey)
                .map(key => {
                    const keyString = primaryKey[key as keyof Object] as unknown as string;
                    return typeof primaryKey[key as keyof Object] === 'number' ? `${key}=${encodeURIComponent(keyString)}` : `${key}='${encodeURIComponent(keyString)}'`;
                })
                .join(',')})`;

        return new Promise((resolve, reject) => {
            this.getODataModel(modelName).read(pathWithKeys, {
                success: (oData: any) => {
                    resolve(oData.result || oData);
                },
                error: (error: any) => {
                    reject(error);
                }
            });
        });
    }

    protected async update<T>({ path, modelName = this.baseModel, entity }: { path: string, modelName?: string, entity: T }): Promise<void> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).update(path, entity as Object, {
                success: () => {
                    resolve();
                },
                error: error => {
                    reject(error);
                }
            });
        });
    }

    public async remove({ path, modelName = this.baseModel }: { path: string, modelName?: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            const onCompleted = (event: any) => {
                this.getODataModel(modelName).detachRequestCompleted(onCompleted);

                if (event.getParameter('success') === false) {
                    reject();
                } else {
                    resolve();
                }
            };

            const onFailed = (err: any) => {
                this.getODataModel(modelName).detachRequestFailed(onFailed);
                reject(err);
            };

            this.getODataModel(modelName).attachRequestCompleted(onCompleted);
            this.getODataModel(modelName).attachRequestFailed(onFailed);
            this.getODataModel(modelName).remove(path);
        });
    }

    public async query<T>({ entitySet, modelName = this.baseModel, filters = [], urlParameters = {} }: { entitySet: string; modelName?: string; filters: Filter[]; urlParameters?: Record<string, string> }): Promise<T> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).read(entitySet, {
                success: (result: any) => {
                    resolve(result.results);
                },
                error: (error: any) => {
                    reject(error);
                },
                filters,
                urlParameters
            });
        });
    }

    public async submit({ modelName = this.baseModel, refresh = true }: { modelName?: string, refresh?: boolean }): Promise<void> {
        const defaultRefreshBehavior = this.getODataModel(modelName).getRefreshAfterChange();
        this.getODataModel(modelName).setRefreshAfterChange(refresh);

        if (!this.getODataModel(modelName).hasPendingChanges(true)) {
            return;
        }

        return new Promise((resolve, reject) => {
            const onCompleted = (event: any) => {
                this.getODataModel(modelName).detachRequestCompleted(onCompleted);
                this.getODataModel(modelName).setRefreshAfterChange(defaultRefreshBehavior);

                if (event.getParameter('success') === false) {
                    reject();
                } else {
                    resolve();
                }
            };

            const onFailed = (error: any) => {
                this.getODataModel(modelName).detachRequestFailed(onFailed);
                this.getODataModel(modelName).setRefreshAfterChange(defaultRefreshBehavior);

                reject(error);
            };

            this.getODataModel(modelName).attachRequestCompleted(onCompleted);
            this.getODataModel(modelName).attachRequestFailed(onFailed);
            this.getODataModel(modelName).submitChanges();
        });
    }

    public async reset(modelName = this.baseModel): Promise<void> {
        await this.getODataModel(modelName).resetChanges();
    }

    public async callFunction<T>({ name, urlParameters, modelName, method = 'GET' }: { name: string, urlParameters: Record<string, string | boolean | number | Date>, modelName?: string, method?: string }): Promise<T> {
        await Promise.allSettled([this.getODataModel(modelName).securityTokenAvailable()]);

        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).callFunction(name, {
                method,
                urlParameters: urlParameters as any,
                success: (result: any) => {
                    resolve(result.result || result.results || result);
                },
                error: (error: any) => {
                    reject(error);
                }
            });
        });
    }

    public async refreshToken(modelName = this.baseModel): Promise<void> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).refreshSecurityToken(
                () => {
                    resolve();
                },
                (erro: any) => {
                    reject(erro);
                }
            );
        });
    }

    public toggleBusy() {
        const busy = this.getStateModel().getProperty('/busy');
        this.getStateModel().setProperty('/busy', !busy);
    }

    public isOnline(): boolean {
        return window.navigator.onLine;
    }

    public async getCurrentUser(): Promise<string> {
        if (!this.getStateModel().getProperty('/user')) {
            const response = await fetch('/sap/bc/ui2/start_up');
            const { id } = await response.json();
            this.getStateModel().setProperty('/user', id);
        }

        return this.getStateModel().getProperty('/user');
    }

    public focusControl(control: any, abortTime = 10000): void {
        if (!control) {
            return;
        }

        let animationFrame = 0;
        let timeout = 0;

        const waitUntilRendered = function () {
            if (!(control.getDomRef() && control.$().size() && control.getFocusDomRef()) || control.getFocusDomRef().disabled) {
                animationFrame = window.requestAnimationFrame(waitUntilRendered);
            } else {
                clearTimeout(timeout);
                control.focus();
            }
        };

        waitUntilRendered();

        timeout = setTimeout(function () {
            window.cancelAnimationFrame(animationFrame);
        }, abortTime);
    }

    public getErrorMessage(error: any): string {
        if (error instanceof Error) {
            const i18nText = this.getText(error.message);

            return i18nText && i18nText !== error.message ? i18nText : error.message;
        }

        try {
            if (error.statusCode === 0) {
                return 'Network error';
            }

            const response = JSON.parse(error.responseText || error.body);

            if (response?.error?.innererror?.errordetails.length > 0) {
                return Array.from(new Set(response.error.innererror.errordetails.reverse().map((error: any) => error.message))).join('\n');
            }

            if (response?.error?.message?.value) {
                return response.error.message.value;
            }
        } catch {
            return error.message?.value || error.message || JSON.stringify(error);
        }
    }

    public navigateToLaunchpad(): void {
        //@ts-ignore
        sap.ushell.Container &&
            //@ts-ignore
            sap.ushell.Container.getService('CrossApplicationNavigation').toExternal({
                target: {
                    semanticObject: '#'
                }
            });
    }

    private polyfillPromiseAllSettled() {
        if (!Promise.allSettled) {
            //@ts-ignore
            Promise.allSettled = function (promises) {
                return Promise.all(
                    promises.map(promise =>
                        promise
                            .then(value => ({
                                status: 'fulfilled',
                                value
                            }))
                            .catch(reason => ({
                                status: 'rejected',
                                reason
                            }))
                    )
                );
            };
        }
    }
}
