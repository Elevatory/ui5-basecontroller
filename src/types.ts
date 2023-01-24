import Filter from "sap/ui/model/Filter";

export type User = {
    client: string;
    email: string;
    firstName: string;
    fullName: string;
    id: string;
    language: string;
    lastName: string;
    system: string;
    timeZone: string;
}

export interface CreateProperties<T = Entity> {
    entitySet: string,
    entity: T,
    modelName?: string
}

export interface CreateEntryProperties<T = Entity> {
    entitySet: string,
    entity?: T,
    modelName?: string
}

export interface ReadProperties {
    entitySet: string,
    entity: Entity,
    modelName?: string
}
export interface QueryProperties<T = Entity> {
    entitySet: string,
    filters?: Filter[],
    urlParameters?: Record<string, string>
    modelName?: string,
}

export interface SubmitProperties {
    refresh?: boolean
    modelName?: string,
}

export interface CallFunctionProperties {
    name: string,
    urlParameters: Entity,
    method?: string
    modelName?: string,
}

export interface RemoveEntityProperties<T = Entity> {
    entitySet: string,
    entity: Partial<T>,
    modelName?: string
}

export interface RemovePathProperties {
    path: string,
    modelName?: string
}

export interface RemoveProperties<T> extends RemoveEntityProperties, RemovePathProperties { };

export interface UpdatePathProperties<T = Entity> {

    path: string,
    entity: Partial<T>,
    modelName?: string
}

export interface UpdateEntityProperties<T = Entity> {
    entitySet: string,
    entity: Partial<T>,
    modelName?: string
}

export interface UpdateProperties<T> extends UpdatePathProperties, UpdateEntityProperties { };

export interface Entity {
    [key: string]: string | number | Date | null | undefined | Entity;
}