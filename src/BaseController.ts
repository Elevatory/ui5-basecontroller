import Filter from 'sap/ui/model/Filter';
import Context from 'sap/ui/model/Context';
import Controller from 'sap/ui/core/mvc/Controller';
import ODataModel from 'sap/ui/model/odata/v2/ODataModel';
import JSONModel from 'sap/ui/model/json/JSONModel';
import MessageBox, { Action } from 'sap/m/MessageBox';
import Component from 'sap/ui/core/Component';
import Router from 'sap/m/routing/Router';
import {
    CallFunctionProperties,
    CreateEntryProperties,
    CreateProperties,
    Entity,
    QueryProperties,
    ReadProperties,
    RemoveEntityProperties,
    RemovePathProperties,
    RemoveProperties,
    SubmitProperties,
    UpdateEntityProperties,
    UpdatePathProperties,
    UpdateProperties
} from './types';

/**
 * @namespace UI5BaseController
 */

export default class BaseController extends Controller {
    private baseModel!: string;

    constructor(model?: string) {
        super('Base');
        this.baseModel = model;
        this.polyfillPromiseAllSettled();
    }

    public getODataModel(id: string = this.baseModel): ODataModel {
        if (id === '') {
            return this.getComponent().getModel() as ODataModel;
        } else {
            return this.getComponent().getModel(id) as ODataModel;
        }
    }

    public getJSONModel(id: string = this.baseModel): JSONModel {
        return this.getComponent().getModel(id) as JSONModel;
    }

    public getText(id: string, ...parameters): string {
        //@ts-ignore
        return this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
    }

    public getComponent(): Component {
        return this.getOwnerComponent() as Component;
    }

    public getRouter(): Router {
        return (this.getOwnerComponent() as any).getRouter();
    }

    public byId<T>(id: string): T {
        return this.getView().byId(id) as T;
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

    public async create<T extends Entity>({ entitySet, entity, modelName = this.baseModel }: CreateProperties<T>): Promise<T> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).create(this.getEntitySetName(entitySet), this.getSanitizedEntity(entitySet, entity), {
                success: (oData: any) => {
                    resolve(oData);
                },
                error: error => {
                    reject(error);
                }
            });
        });
    }

    public createEntry<T extends Entity>({ entitySet, entity = null, modelName = this.baseModel }: CreateEntryProperties<T>): Context {        
        return this.getODataModel(modelName).createEntry(this.getEntitySetName(entitySet), {
            properties: entity ? { properties: this.getSanitizedEntity(entitySet, entity) } : {}
        });
    }

    public async read<T>({ entitySet, entity, modelName = this.baseModel }: ReadProperties): Promise<T> {
        const path = this.getPath(entitySet, entity);

        return new Promise((resolve, reject) => {
            this.getODataModel(modelName).read(path, {
                success: (oData: any) => {
                    resolve(oData.result || oData);
                },
                error: (error: any) => {
                    reject(error);
                }
            });
        });
    }

    protected async update({ path, entity, modelName = this.baseModel }: UpdatePathProperties): Promise<void>;
    protected async update({ entitySet, entity, modelName = this.baseModel }: UpdateEntityProperties): Promise<void>;

    protected async update({ path, entity, entitySet, modelName = this.baseModel }: UpdateProperties): Promise<void> {
        return await new Promise((resolve, reject) => {
            path = path ? path : this.getPath(entitySet, entity);
            entity = this.getSanitizedEntity(entitySet, entity);
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

    public async remove({ path, modelName }: RemovePathProperties): Promise<void>;
    public async remove({ entitySet, entity, modelName }: RemoveEntityProperties): Promise<void>;

    public async remove({ path, entitySet, entity, modelName = this.baseModel }: RemoveProperties): Promise<void> {
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
            try {
                this.getODataModel(modelName).attachRequestCompleted(onCompleted);
                this.getODataModel(modelName).attachRequestFailed(onFailed);
                this.getODataModel(modelName).remove(path ? path : this.getPath(entitySet, entity));
            } catch (error) {
                this.getODataModel(modelName).detachRequestCompleted(onCompleted);
                this.getODataModel(modelName).detachRequestFailed(onFailed);
            }
        });
    }

    public async query<T>({ entitySet, filters = [], urlParameters = {}, modelName = this.baseModel }: QueryProperties): Promise<T> {
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

    public async submit({ refresh = true, modelName = this.baseModel }: SubmitProperties): Promise<void> {
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

    public async callFunction<T>({ name, urlParameters, method = 'GET', modelName }: CallFunctionProperties): Promise<T> {
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

    public isOnline(): boolean {
        return window.navigator.onLine;
    }

    public async getCurrentUser(): Promise<string> {
        if (!this.getJSONModel('state').getProperty('/user')) {
            const response = await fetch('/sap/bc/ui2/start_up');
            const { id } = await response.json();
            this.getJSONModel('state').setProperty('/user', id);
        }

        return this.getJSONModel('state').getProperty('/user');
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

    private getEntitySetName(entitySet: string): string {
        return entitySet.startsWith('/') ? entitySet : `/${entitySet}`;
    }

    private getPath(entitySet: string, entity: Entity): string {
        const entitySetName = this.getEntitySetName(entitySet);
        const primaryKeys = this.getPrimaryKeys(entitySet);
        const primaryKeyString =
            primaryKeys.length === 1 ? `'${encodeURIComponent(entity[primaryKeys[0]] as string)}'` : `${primaryKeys.map(key => `${key}='${encodeURIComponent(entity[key] as string)}'`).join(',')}`;

        return `${entitySetName}(${primaryKeyString})`;
    }

    private getPrimaryKeys(entitySet: string): string[] {
        const entityType = this.getEntitySetType(entitySet);
        return this.getEntityTypeKeyNames(entityType);
    }

    private getSanitizedEntity(entitySet: string, entity: Entity): Entity {
        const primaryKeys = this.getPrimaryKeys(entitySet);
        const missingKeys = primaryKeys.filter(key => !entity[key]);

        if (missingKeys.length > 0) {
            throw new Error(`Entity is missing keys: ${missingKeys.join(', ')}`);
        }

        const properties = this.getEntityTypePropertyNames(this.getEntitySetType(entitySet));

        return Object.keys(entity).reduce((result: Entity, property: string) => {
            if (properties.includes(property)) {
                result[property] = entity[property];
            }

            return result;
        }, {});
    }

    private getEntitySetType(entitySet: string): string {
        const metadata = this.getODataModel().getServiceMetadata();

        //@ts-ignore
        const namespace = metadata.dataServices.schema[0].namespace;
        //@ts-ignore
        const entityType = metadata.dataServices.schema[0].entityContainer[0].entitySet.find((set: any) => set.name === entitySet.replace(/^\//, ''))?.entityType.replace(namespace + '.', '');

        if (!entityType) {
            throw new Error(`Entity set ${entitySet} not found in metadata`);
        }

        return entityType;
    }

    private getEntityTypePropertyNames(entityType: string): string[] {
        const metadata = this.getODataModel().getServiceMetadata();

        //@ts-ignore
        const properties = metadata.dataServices.schema[0].entityType.find((type: any) => type.name === entityType)?.property.map((property: any) => property.name);

        if (!properties) {
            throw new Error(`Entity type ${entityType} not found in metadata`);
        }
        
        return properties;
    }

    private getEntityTypeKeyNames(entityType: string): string[] {
        const metadata = this.getODataModel().getServiceMetadata();

        //@ts-ignore
        const keys = metadata.dataServices.schema[0].entityType.find((type: any) => type.name === entityType)?.key.propertyRef.map((property: any) => property.name);

        if (!keys) {
            throw new Error(`Entity type ${entityType} not found in metadata`);
        }

        return keys;
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
