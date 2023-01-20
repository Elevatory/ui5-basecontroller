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

export interface CreateProperties {
    entitySet: string,
    entity: Entity,
    modelName?: string
}

export interface CreateEntryProperties {
    entitySet: string,
    entity?: Entity,
    modelName?: string
}

export interface ReadProperties {
    entitySet: string,
    entity: Entity,
    modelName?: string
}


export interface RemoveEntityProperties {
    entitySet: string,
    entity: Entity,
    modelName?: string
}

export interface RemovePathProperties {
    path: string,
    modelName?: string
}

export interface RemoveProperties extends RemoveEntityProperties, RemovePathProperties { };

export interface QueryProperties {
    entitySet: string,
    filters: Filter[],
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

export interface UpdatePathProperties {
    path: string,
    entity: Entity,
    modelName?: string
}

export interface UpdateEntityProperties {
    entitySet: string,
    entity: Entity,
    modelName?: string
}

export interface UpdateProperties extends UpdatePathProperties, UpdateEntityProperties { };

export type Entity = Record<string, string | boolean | number | Date>;

