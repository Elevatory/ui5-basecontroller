# UI5 Base Controller
This project contains a single class with usefull functions for developing SAPUI5 Web Applications with TypeScript and an OData Backend.
The development is carried out by [Elevatory](https://www.elevatory.de "Elevatory - Design und Entwicklung von Clean Code Enterprise Applications mit SAP ABAP und Fiori").
We specialize in the development of SAP applications with ABAP, SAPUI5/Fiori and SAP HANA.

# Installation
`npm install @elevatory/ui5-basecontroller`

In order to make `BaseController.js` available for your application you have to bring it to your application folder.
The easiest way is to copy the file from the node_modules folder to your source code folder.
Please keep in mind, that you have to carry out the copy step again whenever you install a new version of the Validator via npm.

Another option is to use a bundler and a transpiler to create a serve & build step that automates the process of including npm modules into UI5 applications. 

# Usage
As soon as you have `BaseController.js` in you source folder, you can use it in any UI5 Code file.
You will most likely use it as a parent class for your controllers.

## Create an Instance
The base controller is designed to the be parent class of all your controllers.
That means that yout controllers should extend the Base Controller class.

### Extending the Base Controller
```TS
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

```TS
export default class Example extends BaseController {
    constructor() {
        super('someDefaultModelName');
    }
}
```

## Methods
The Base Controller implements basic and useful methods for developing SAPUI5 Applications.

### OData Methods
A lot of methods are trying to make the usage of OData Operations easier for you.
In general all operations are performed with the default model unless you explicitly provide another model when calling a method.

Some of the methods offer the option to provide a type via generics.

#### getODataModel
This method returns an instance of the default OData Model if no argument is provided.  
```TS
const defaultODataModel = this.getODataModel();
```

You can also provide the name of an ODate Model to get an instance of that particular model.

```TS
const anyODataModel = this.getODataModel('anyODataModel');
```

#### create
This method promisifies the create operation of the OData Model.  
`path` should be set to the name of the EntitySet with leading a leading slash.

The `properties` parameter is the object to be created.

```TS
await this.create<BusinessPartner>({
    path: '/BusinessPartnerSet',
    properties: { businessPartner: '123456' },
});
```

#### createEntry
This method triggers the createEntry operation of the OData Model.
`path` should be set to the name of the EntitySet with leading a leading slash.

The `properties` parameter is the object to be created.

```TS
const context = this.createEntry({
    path: '/BusinessPartnerSet',
    properties: {
       Address: { AddressType: '02' },
   }
});
```

#### read
This method promisifies the read operation of the OData Model.  

It takes at least two parameters as an input
`entitySet`should be set to the name of the EntitySet with a leading slash.  
`rimaryKey` receives an object with name-value-pairs of the Entities Primary Keys.  
The generic T can be used for already forming it to the given type.  

__Need your Metadata as TypeScript Types?__ - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).  

```TS
await this.read<BusinessPartner>({
    entitySet: '/BusinessPartnerSet',
    primaryKey: { businessPartner: '123456'},
});
```

#### update
This function promisifies the update operation of the OData Model.

```TS
await this.update<BusinessPartner>({
    path: '/BusinessPartnerSet',
    entity: { businessPartner: '123456', addressId: 1341 },
    modelName: 'odata'
});
```

#### remove
This function promisifies the remove operation of the OData Model.

```TS
public async onDelete(event: Event) {
    const path = (event.getSource() as Button).getBindingContext()!.getPath();
    if (await this.confirm('confirmDelete')) {
        await this.remove({ path });
    }
}
```

#### query
This function promisifies the read(GetList) operation of the OData Model.  
The generic T can be used for already forming it to the given Type.    

__Need your Metadata as TypeScript Types?__ - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).  

```TS
const filters = Filter[];
filters.push(new Filter({ path: 'businessPartner', operator: 'EQ', value1: '123456' }));

await this.query<BusinessPartner>({
    entitySet: '/BusinessPartnerSet',
    filters: filters,
    modelName: 'odata'
});
```

#### submit
This function promisifies the submitChanges function of the given OData Model.  
Before submitting, it will check for pending changes.  
If there are no pending changes the submit will be aborted.

```TS
await this.submit({ modelName: 'odata', refresh: true});
```

#### reset
This function will trigger the resetChanges function of the given OData Model.

```TS
this.reset();
```

#### callFunction
This function promisifies the callFunction of the given OdataModel.  
It will receive the Name of the function call/function import aswell as the url Parameters for the call.  
The generic T can be used for the returning type of the function import.  

__Need your Metadata as TypeScript Types?__ - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).  

```TS
public async onCallFunction(): Promise<void> {
    const result = await this.callFunction({ name: "/RegenerateAllData", urlParameters: { NoOfSalesOrders: 10 } });
    MessageBox.show(`Result: ${result}`);
}
```

#### refreshToken
This function will trigger the refreshSecurityToken of the given ODataModel.

```TS
public async onRefreshToken(): Promise<void> {
    await this.refreshToken();
    MessageBox.show(`Token refreshed`);
}
```

### Messaging Methods
The following methods are designed to help you to communicate with the user.

#### clearMessageManager
Remove all Messages of the global MessageManager

```TS
this.clearMessageManager();
```

#### async confirm
Creates a confirmation dialog.  
textId is used for the confirmation text, titleTextId is used for the Title of the Dialog.  
Both Ids need to be i18n Text Ids.

```TS
const isConfirmed = await this.confirm('confirmQuestionId', 'confirmTitleId');
```

#### async showError
Creates a new MessageBox with the error being shown.  
Error could be string or a OData Call response.  
The Promise will be fulfilled when the user closes the dialog.

```TS
await this.showError(response);
```

#### getErrorMessage
This will parse a OData Error Message and will return the error message.  
If there are multiple error messages included, they will be concatenated and seperated by a line-break `\n`.

```TS
const errorMessage = this.getErrorMessage(error);
```
#### inform

#### getText
This function loads the i18n ResourceBundle and retrieves the given text.  
The parameters-Object will be used as secondParameter of getText-Function of the ResourceBundle. 

```TS
this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
```

Example
```TS
const text = this.getText("i18nTextId");
```

### Working with Controls

#### byId
This function replaces the standard controller function this.getView().byId("<id>").  
The parameter T is a generic and should be set to the Type you want to receive. For example for an Input-Field:  
```TS
this.byId<Input>("idInputField")
```

#### toggleBusy
This function will flip the property `/busy` of the statemodel `state`.  
The property /busy could be used for a busy indicator.
```TS
public onToggleBusy(): void {
    this.toggleBusy();
    MessageBox.show(`Busy toggled, aktuell ${this.getStateModel().getProperty("/busy")}`);
}
```

#### focusControl
Focus a given control by DOM reference.
It will be aborted as soon as the abortTime is over.  
The abortion will trigger `window.cancelAnimationFrame`.

```TS
public onFocusControl(): void {
    this.focusControl(this.byId("byIdButton"));
}
```

### Shortcut Methods
Shortcuts are designed to reduce the amount of typing and to add type informations to certain operations.

#### getJSONModel
This function returns the given model as JSONModel.  
It is defaulted by the BaseModel which is set in the constructor.  

```TS
const model = this.getJSONModel("state");
```

#### getStateModel
A StateModel is an application wide JSONModel used for cross-view data saving and controls.  
The Model "state" has to be defined in manifest.json for it to be working.

```TS
const stateModel = this.getStateModel();
```

#### getComponent
The function returns the Component retreived by this.getView().getOwnerComponent() as correct Type

```TS
const component = this.getComponent();
```

#### getRouter
This function retreives the Router-Object by the Controllers OwnerComponent.

```TS
const router = this.getRouter();
```

#### isOnline
This will return a boolean value if the browser is online.  
It is checked by default window property `window.navigator.onLine`

```TS
public onIsOnline(): void {
    const online = this.isOnline();
    MessageBox.show(`Online: ${online}`);
}
```

#### navigateToLaunchpad
This will navigate to the Fiori launchpad.  
It will only work if it's a Fiori application.

```TS
public onNavigateToLaunchpad(): void {
    this.navigateToLaunchpad();
}
```

# Authors
The development is carried out by [Elevatory](https://www.elevatory.de).
We specialize in the development of SAP applications with ABAP, SAPUI5/Fiori and SAP HANA.
