# UI5 Base Controller

This project contains a single class with usefull functions for developing SAPUI5 Web Applications with TypeScript and an OData Backend.
The development is carried out by [Elevatory](https://www.elevatory.de 'Elevatory - Design und Entwicklung von Clean Code Enterprise Applications mit SAP ABAP und Fiori').
We specialize in the development of SAP applications with ABAP, SAPUI5/Fiori and SAP HANA.

# Installation

`npm install @elevatory/ui5-basecontroller`

In order to make `BaseController.js` available for your application you have to bring it to your application folder.
The easiest way is to copy the file from the node_modules folder to your source code folder.
Please keep in mind, that you have to carry out the copy step again whenever you install a new version of the Validator via npm.

Another option is to use a bundler and a transpiler to create a serve & build step that automates the process of including npm modules into UI5 applications.

Luckily there is a great project [UI5 Tooling Extensions for NPM Package Consumption](https://www.npmjs.com/package/ui5-tooling-modules) that does all of that for you. Check it out.

# Usage

As soon as you have `BaseController.js` in you source folder, you can use it in any UI5 Code file.
You will most likely use it as a parent class for your controllers.

## Create an Instance

The base controller is designed to the be parent class of all your controllers.
That means that your controllers should extend the BaseController class.

### Extending the Base Controller

```typescript
export default class Example extends BaseController {
    constructor() {
        super();
    }
}
```

### Setting the default OData Model

The constructor of the BaseController class has an optional parameter, that can be provided with the name of an OData Model.
This will set the given OData Model to the default model of your controller.
All OData Operations, that are provided by the Base Controller will be defaulted to this model if no other model is explicitly specified.

```typescript
export default class Example extends BaseController {
    constructor() {
        super('someDefaultModelName');
    }
}
```

## Methods

The Base Controller implements basic and useful methods for developing SAPUI5 Applications.

### OData Methods

A lot of methods are trying to make the use of OData Operations easier for you.

As you might already now, the SAPUI5 OData Model object uses callbacks to handle asynchronous operation.
We promisified most of these functions, by wrapping them into methods of the BaseController class.

In addition we added stuff like:

-   optional typing with generics
-   method signatures with objects instead of long parameter list
-   automatic generation of OData Paths from given objects
-   automatic removal of extranous properties that are not part of the metadata before executing a create or update operation

In general all operations are performed with the default model unless you explicitly provide another model when calling a method.
Some of the methods offer the option to provide a type via generics.

**Need your Metadata as TypeScript Types?** - Look at [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).

#### **getODataModel**

This method returns an instance of the default OData Model if no argument is provided.

```typescript
const defaultODataModel = this.getODataModel();
```

You can also provide the name of an ODate Model to get an instance of that particular model.

```typescript
const anyODataModel = this.getODataModel('anyODataModel');
```

#### **create**

This method wraps and promisifies the create operation of the OData Model.

-   `entitySet` is the name of the EntitySet for which you want to create a new entity
-   `entity` is an object of the entity to be created

```typescript
const businessPartner = await this.create({
    entitySet: 'BusinessPartnerSet',
    entity: {
        BusinessPartnerID: '123456',
        Address: { AddressType: '02' }
    }
});
```

You can specify the type of the entity with an optional generic.
This will lead to the following:

-   the provided entity is checked against the type
-   the returning entity is set to the type

```typescript
const businessPartner = await this.create<BusinessPartner>({
    entitySet: 'BusinessPartnerSet',
    entity: {
        BusinessPartnerID: '123456',
        Address: { AddressType: '02' },
        CompanyName: 'Test Company',
        EmailAddress: '123@example.com',
        CurrencyCode: 'EUR',
        BusinessPartnerRole: '01'
    }
});
```

In this example all required properties of the entity have to be provided.

#### **createEntry**

This method wraps the createEntry operation of the OData Model.

-   `entitySet` is the name of the EntitySet for which you want to create a new entity
-   `entity` is an object of the entity to be created

```typescript
const context = this.createEntry({
    entitySet: 'BusinessPartnerSet',
    entity: {
        BusinessPartnerID: '123456',
        Address: { AddressType: '02' }
    }
});
```

You can specify the type of the entity with an optional generic.
This will lead to the following:

-   the provided entity is checked against the type

```typescript
const context = await this.createEntry<BusinessPartner>({
    entitySet: 'BusinessPartnerSet',
    entity: {
        BusinessPartnerID: '123456',
        Address: { AddressType: '02' },
        CompanyName: 'Test Company',
        EmailAddress: '123@example.com',
        CurrencyCode: 'EUR',
        BusinessPartnerRole: '01'
    }
});
```

#### **read**

This method wraps and promisifies the read operation of the OData Model.  
It is designed to read a single entity. If you want to read an entity set, take a look at the **query** method.

-   `entitySet` is the name of the EntitySet for which you want to create a new entity
-   `entity` is an object containing the primary keys of the entity. Properties that are not part of the key will be ignored.

```typescript
await this.read<BusinessPartner>({
    entitySet: 'BusinessPartnerSet',
    entity: { businessPartner: '123456' }
});
```

You can specify the returning type of the method by using optional generics (e.g. `<BusinessPartner>`).

#### **update**

This function promisifies the update operation of the OData Model.

It takes at least two parameters as an input

-   `path` should be set to the entity path in the odata model.
-   `entity` should contain the object to be updated. Properties not existing in the entity metadata will be ignored.

```typescript
await this.update<BusinessPartner>({
    path: '/BusinessPartnerSet("123456")',
    entity: { businessPartner: '123456', addressId: 1341 }
});
```

Otherwise an overload for this function exists.  
It takes at least two parameters as an input

-   `entitySet` should be set to the name of the EntitySet. If the leading Slash is missing, it will be added automatically.
-   `entity` should contain the object to be updated. Properties not existing in the entity metadata will be ignored.

```typescript
await this.update<BusinessPartner>({
    entitySet: '/BusinessPartnerSet',
    entity: { businessPartner: '123456', addressId: 1341 }
});
```

#### **remove**

This function promisifies the remove operation of the OData Model.

It takes at least the `path` parameter which should give the odata metadata path

```typescript
public async onDelete(event: Event) {
    const path = (event.getSource() as Button).getBindingContext()!.getPath();
    if (await this.confirm('confirmDelete')) {
        await this.remove({ path }); // e.g. "/BusinessPartnerSet('123456')"
    }
}
```

If the path is unknown, an overload for this function exists.  
It takes at least two parameters as an input

-   `entitySet` should be set to the name of the EntitySet. If the leading Slash is missing, it will be added automatically.
-   `entity` should contain the object to be updated. Properties not existing in the entity metadata will be ignored.

```typescript
await this.remove({
    entitySet: '/BusinessPartnerSet',
    entity: { businessPartner: '123456' }
});
```

#### **query**

This function promisifies the read(GetList) operation of the OData Model.  
The generic T can be used for already forming it to the given Type.

It takes at least the `entitySet` parameter as an input.  
This should give the name of the EntitySet. If the leading Slash is missing, it will be added automatically.

The following parameters are optional

-   `filters` should give an Array of OData filters( see sap.ui.model.Filter )
-   `urlParameters` should give an object of the query operation (see Query Documentation of OData)
-   `modelName` should give the name of the odata model. It is defaulted by constructor.

```typescript
const filters = Filter[];
filters.push(new Filter({ path: 'businessPartner', operator: 'EQ', value1: '123456' }));

await this.query<BusinessPartner>({
    entitySet: '/BusinessPartnerSet',
    filters: filters,
    modelName: 'odata'
});
```

#### **submit**

This function promisifies the submitChanges function of the given OData Model.  
Before submitting, it will check for pending changes.  
If there are no pending changes the submit will be aborted.

It takes two optional parameters

-   `refresh` triggers a odata model and view refresh after changes are successful
-   `modelName` should give the name of the odata model. It is defaulted by constructor.

```typescript
await this.submit({});
```

#### **reset**

This function will trigger the resetChanges function of the given OData Model.  
It takes the optional parameter `modelName` which should receive the name of the odata model. It is defaulted by constructor.

```typescript
this.reset();
```

#### **callFunction**

This function promisifies the callFunction of the given OdataModel.  
It will receive the Name of the function call/function import aswell as the url Parameters for the call.  
The generic T can be used for the returning type of the function import.

It takes at least two parameters

-   `name` should receive the name of the function call
-   `urlParameters` takes the name-value-pairs for the importing parameters

There is two optional parameters

-   `method` for the http method, defaulted to 'GET'
-   `modelName` should give the name of the odata model. It is defaulted by constructor.

**Need your Metadata as TypeScript Types?** - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).

```typescript
public async onCallFunction(): Promise<void> {
    const result = await this.callFunction({ name: "/RegenerateAllData", urlParameters: { NoOfSalesOrders: 10 } });
    MessageBox.show(`Result: ${result}`);
}
```

#### **refreshToken**

This function will trigger the refreshSecurityToken of the given ODataModel.  
It has a default parameter `modelName` which receives the name of the odata model.

```typescript
public async onRefreshToken(): Promise<void> {
    await this.refreshToken();
    MessageBox.show(`Token refreshed`);
}
```

### Messaging Methods

The following methods are designed to help you to communicate with the user.

#### **clearMessageManager**

Remove all Messages of the global MessageManager

```typescript
this.clearMessageManager();
```

#### **async confirm**

Creates a confirmation dialog.

It takes two obligatory parameters

-   `textId` is used for the confirmation text
-   `titleTextId` is used for the Title of the Dialog
    Both Ids need to be i18n Text Ids.

```typescript
const isConfirmed = await this.confirm('confirmQuestionId', 'confirmTitleId');
```

#### **async inform**

Creates a information dialog.

It takes two parameters

-   `textId` is used for the confirmation text. It can be i18n text symbol or string
-   `titleTextId` is used for the Title of the Dialog. It can be i18n text symbol, string or empty.

```typescript
const isConfirmed = await this.confirm('confirmQuestionId', 'confirmTitleId');
```

#### **async showError**

Creates a new MessageBox with the error being shown.  
Error could be string or a OData Call response.  
The Promise will be fulfilled when the user closes the dialog.

```typescript
await this.showError(response);
```

#### **getErrorMessage**

This will parse a OData Error Message and will return the error message.  
If there are multiple error messages included, they will be concatenated and seperated by a line-break `\n`.

```typescript
const errorMessage = this.getErrorMessage(error);
```

#### **getText**

This function loads the i18n ResourceBundle and retrieves the given text.  
The parameters-Object will be used as secondParameter of getText-Function of the ResourceBundle.

```typescript
this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
```

Example

```typescript
const text = this.getText('i18nTextId');
```

### Working with Controls

#### **byId**

This function replaces the standard controller function this.getView().byId("<id>").  
The parameter T is a generic and should be set to the Type you want to receive. For example for an Input-Field:

```typescript
this.byId<Input>('idInputField');
```

#### **focusControl**

Focus a given control by DOM reference.
It will be aborted as soon as the abortTime is over.  
The abortion will trigger `window.cancelAnimationFrame`.

```typescript
public onFocusControl(): void {
    this.focusControl(this.byId("byIdButton"));
}
```

### Shortcut Methods

Shortcuts are designed to reduce the amount of typing and to add type informations to certain operations.

#### **getJSONModel**

This function returns the given model as JSONModel.  
It is defaulted by the BaseModel which is set in the constructor.

```typescript
const model = this.getJSONModel('state');
```

#### **getComponent**

The function returns the Component retreived by this.getView().getOwnerComponent() as correct Type

```typescript
const component = this.getComponent();
```

#### **getRouter**

This function retreives the Router-Object by the Controllers OwnerComponent.

```typescript
const router = this.getRouter();
```

#### **isOnline**

This will return a boolean value if the browser is online.  
It is checked by default window property `window.navigator.onLine`

```typescript
public onIsOnline(): void {
    const online = this.isOnline();
    MessageBox.show(`Online: ${online}`);
}
```

#### **async getCurrentUser**

This will retreive the logged in user.

```typescript
public async onGetCurrentUser(): Promise<void> {
    const user = await this.getCurrentUser();
    MessageBox.show(`User: ${user}`);
}
```

#### **navigateToLaunchpad**

This will navigate to the Fiori launchpad.  
It will only work if it's a Fiori application.

```typescript
public onNavigateToLaunchpad(): void {
    this.navigateToLaunchpad();
}
```

# Authors

The development is carried out by [Elevatory](https://www.elevatory.de).
We specialize in the development of SAP applications with ABAP, SAPUI5/Fiori and SAP HANA.
