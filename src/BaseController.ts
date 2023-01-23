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

    protected getODataModel(id: string = this.baseModel): ODataModel {
        if (id === '') {
            return this.getComponent().getModel() as ODataModel;
        } else {
            return this.getComponent().getModel(id) as ODataModel;
        }
    }

    protected getJSONModel(id: string = this.baseModel): JSONModel {
        return this.getComponent().getModel(id) as JSONModel;
    }

    protected getText(id: string, ...parameters): string {
        //@ts-ignore
        return this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
    }

    protected getComponent(): Component {
        return this.getOwnerComponent() as Component;
    }

    protected getRouter(): Router {
        return (this.getOwnerComponent() as any).getRouter();
    }

    public byId<T>(id: string): T {
        return this.getView().byId(id) as T;
    }

    protected clearMessageManager(): void {
        sap.ui.getCore().getMessageManager().removeAllMessages();
    }

    protected async confirm(textId, titleTextId?: string): Promise<boolean> {
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

    protected async showError(error): Promise<void> {
        return await new Promise(resolve => {
            console.error(error);

            MessageBox.error(this.getErrorMessage(error), {
                onClose: () => {
                    resolve();
                }
            });
        });
    }

    protected async create<T extends Entity>({ entitySet, entity, modelName = this.baseModel }: CreateProperties<T>): Promise<T> {
        return await new Promise((resolve, reject) => {
            this.getODataModel(modelName).create(this.getEntitySetNameWithLeadingSlash(entitySet), this.getSanitizedEntity(entitySet, entity), {
                success: (oData: any) => {
                    resolve(oData);
                },
                error: error => {
                    reject(error);
                }
            });
        });
    }

    protected createEntry<T extends Entity>({ entitySet, entity, modelName = this.baseModel }: CreateEntryProperties<T>): Context {
        return this.getODataModel(modelName).createEntry(this.getEntitySetNameWithLeadingSlash(entitySet), {
            properties: entity ? this.getSanitizedEntity(entitySet, entity) : {}
        });
    }

    protected async read<T>({ entitySet, entity, modelName = this.baseModel }: ReadProperties): Promise<T> {
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

    protected async update<T>({ path, entity, modelName = this.baseModel }: UpdatePathProperties<T>): Promise<void>;
    protected async update<T>({ entitySet, entity, modelName = this.baseModel }: UpdateEntityProperties<T>): Promise<void>;

    protected async update<T>({ path, entity, entitySet, modelName = this.baseModel }: UpdateProperties<T>): Promise<void> {
        return await new Promise((resolve, reject) => {
            entitySet = entitySet ? entitySet : this.getEntitySetName(path || entitySet);
            entity = this.getSanitizedEntity(entitySet, entity);
            path = path ? path : this.getPath(entitySet, entity);
            path = path.startsWith('/') ? path : '/' + path;

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

    protected async remove<T>({ path, modelName }: RemovePathProperties): Promise<void>;
    protected async remove<T>({ entitySet, entity, modelName }: RemoveEntityProperties<T>): Promise<void>;

    protected async remove<T>({ path, entitySet, entity, modelName = this.baseModel }: RemoveProperties<T>): Promise<void> {
        return new Promise((resolve, reject) => {
            entitySet = entitySet ? entitySet : this.getEntitySetName(path || entitySet);
            entity = this.getSanitizedEntity(entitySet, entity);
            path = path ? path : this.getPath(entitySet, entity);
            path = path.startsWith('/') ? path : '/' + path;

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
                this.getODataModel(modelName).remove(path);
            } catch (error) {
                this.getODataModel(modelName).detachRequestCompleted(onCompleted);
                this.getODataModel(modelName).detachRequestFailed(onFailed);
            }
        });
    }

    protected async query<T>({ entitySet, filters = [], urlParameters = {}, modelName = this.baseModel }: QueryProperties<T>): Promise<T> {
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

    protected async submit({ refresh = true, modelName = this.baseModel }: SubmitProperties): Promise<void> {
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

    protected async reset(modelName = this.baseModel): Promise<void> {
        await this.getODataModel(modelName).resetChanges();
    }

    protected async callFunction<T>({ name, urlParameters, method = 'GET', modelName }: CallFunctionProperties): Promise<T> {
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

    protected async refreshToken(modelName = this.baseModel): Promise<void> {
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

    protected isOnline(): boolean {
        return window.navigator.onLine;
    }

    protected async getCurrentUser(): Promise<string> {
        if (!this.getJSONModel('state').getProperty('/user')) {
            const response = await fetch('/sap/bc/ui2/start_up');
            const { id } = await response.json();
            this.getJSONModel('state').setProperty('/user', id);
        }

        return this.getJSONModel('state').getProperty('/user');
    }

    protected focusControl(control: any, abortTime = 10000): void {
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

    protected getErrorMessage(error: any): string {
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

    protected navigateToLaunchpad(): void {
        //@ts-ignore
        sap.ushell.Container &&
            //@ts-ignore
            sap.ushell.Container.getService('CrossApplicationNavigation').toExternal({
                target: {
                    semanticObject: '#'
                }
            });
    }

    private getEntitySetNameWithLeadingSlash(entitySet: string): string {
        return entitySet.startsWith('/') ? entitySet : `/${entitySet}`;
    }

    private getEntitySetName(path: string): string {
        return path.split('(')[0].replace(/^\//, '');
    }

    private getPath(entitySet: string, entity: Entity): string {
        const primaryKeys = this.getPrimaryKeys(entitySet);
        const sanitizedEntity = this.getSanitizedEntity(entitySet, entity);

        const primaryKeyString =
            primaryKeys.length === 1 ? `'${encodeURIComponent(sanitizedEntity[primaryKeys[0]] as string)}'` : `${primaryKeys.map(key => `${key}='${encodeURIComponent(sanitizedEntity[key] as string)}'`).join(',')}`;

        return `${this.getEntitySetNameWithLeadingSlash(entitySet)}(${primaryKeyString})`;
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
