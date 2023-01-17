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

# Functions
The BaseController implements basic and useful functions for developing SAPUI5 Web Applications with TypeScript.


## constructor()
The Constructor initializes the object with the given model.  
This model is used as BaseModel so it doesn't need to be entered in the following functions.  
The constructor will also try to polyfill the `Promise.allSettled` Function, if it does not already exist in the given UI5/JavaScript libraries.
```TS
export default class Example extends BaseController {
    constructor() {
        super('modelname');
    }
}
```

## getODataModel()
This function returns the given model as ODataModel.  
It is defaulted by the BaseModel which is set in the constructor.
```TS
const model = this.getODataModel("modelname");
```

## getJSONModel()
This function returns the given model as JSONModel.  
It is defaulted by the BaseModel which is set in the constructor.  
```TS
const model = this.getJSONModel("state");
```

## getText(id: string, ...parameters): string
This function loads the i18n ResourceBundle and retrieves the given text.  
The parameters-Object will be used as secondParameter of getText-Function of the ResourceBundle.  
```TS
this.getComponent().getModel('i18n').getResourceBundle().getText(id, parameters);
```

Example
```TS
const text = this.getText("i18nTextId");
```

## getComponent()
The function returns the Component retreived by this.getView().getOwnerComponent() as correct Type
```TS
const component = this.getComponent();
```

## getRouter()
This function retreives the Router-Object by the Controllers OwnerComponent.
```TS
const router = this.getRouter();
```

## byId()
This function replaces the standard controller function this.getView().byId("<id>").  
The parameter T is a generic and should be set to the Type you want to receive. For example for an Input-Field:  
```TS
this.byId<Input>("idInputField")
```

## getStateModel()
A StateModel is an application wide JSONModel used for cross-view data saving and controls.  
The Model "state" has to be defined in manifest.json for it to be working.
```TS
const stateModel = this.getStateModel();
```

## async quicksave()
This function triggers the submit function of the baseModel OData Model and saves changes in the model.
```TS
await this.quicksave();
```

## clearMessageManager()
Remove all Messages of the global MessageManager
```TS
this.clearMessageManager();
```

## async confirm();
Creates a confirmation dialog.  
textId is used for the confirmation text, titleTextId is used for the Title of the Dialog.  
Both Ids need to be i18n Text Ids.
```TS
const isConfirmed = await this.confirm('confirmQuestionId', 'confirmTitleId');
```

## async showError()
Creates a new MessageBox with the error being shown.  
Error could be string or a OData Call response.  
The Promise will be fulfilled when the user closes the dialog.
```TS
await this.showError(response);
```

## async create()
This function promisifies the create-operation of the ODataModel.  
Path should be set to the EntitySet with leading Slash.  
The properties parameter holds the object needed to be created aligned to the OData Entity.
```TS
await this.create<BusinessPartner>({
    path: '/BusinessPartnerSet',
    properties: { businessPartner: '123456' },
    modelName: 'odata'
});
```

## createEntry()
This function triggers the createEntry-operation of the ODataModel.
```TS
const context = this.createEntry({
    path: '/BusinessPartnerSet',
    properties: {
       Address: { AddressType: '02' },
       modelName: 'odata'
   }
});
```

## async read()
This function promisifies the read-operation of the ODataModel.  
Entityset should be set to the Entityset with leading Slash.  
PrimaryKey receives an Object with name-value-pairs of the Entities Primary Keys.  
The generic T can be used for already forming it to the given Type.  
__Need your Metadata as TypeScript Types?__ - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).  
```TS
await this.read<BusinessPartner>({
    entitySet: '/BusinessPartnerSet',
    primaryKey: { businessPartner: '123456'},
    modelName: 'odata'
});
```

## async update()
This function promisifies the update-operation of the ODataModel.
```TS
await this.update<BusinessPartner>({
    path: '/BusinessPartnerSet',
    entity: { businessPartner: '123456', addressId: 1341 },
    modelName: 'odata'
});
```
## async remove())
This function promisifies the remove-operation of the ODataModel.
```TS
public async onDelete(event: Event) {
    const path = (event.getSource() as Button).getBindingContext()!.getPath();
    if (await this.confirm('confirmDelete')) {
        await this.remove({ path });
    }
}
```

## async query()
This function promisifies the read(GetList)-operation of the ODataModel.  
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

## async submit({ modelName = this.baseModel, refresh = true }: { modelName?: string, refresh?: boolean }): Promise<void>
This function promisifies the submitChanges function of the given ODataModel.  
Before submitting, it will check for pending changes.  
If there are no pending changes the submit will be aborted.

## async reset(modelName = this.baseModel): Promise<void>
This function will trigger the resetChanges function of the given ODataModel.

## async callFunction<T>({ name, urlParameters, modelName, method = 'GET' }: { name: string, urlParameters: Record<string, string | boolean | number | Date>, modelName?: string, method?: string }): Promise<T>
This function promisifies the callFunction of the given OdataModel.  
It will receive the Name of the function call/function import aswell as the url Parameters for the call.  
The generic T can be used for the returning type of the function import.  
__Need your Metadata as TypeScript Types?__ - Look at the [OData Typify Middleware](https://www.npmjs.com/package/@elevatory/odata-typify-middleware).  

## async refreshToken(modelName = this.baseModel): Promise<void>
This function will trigger the refreshSecurityToken of the given ODataModel.

## toggleBusy()
This function will flip the property `/busy` of the statemodel `state`.  
The property /busy could be used for a busy indicator.

## isOnline(): boolean
This will return a boolean value if the browser is online.  
It is checked by default window property `window.navigator.onLine`

## focusControl(control: any, abortTime = 10000): void
Focus a given control by DOM reference.
It will be aborted as soon as the abortTime is over.  
The abortion will trigger `window.cancelAnimationFrame`

## public getErrorMessage(error: any): string
This will parse a OData Error Message and will return the error message.  
If there are multiple error messages included, they will be concatenated and seperated by a line-break `\n`.

## navigateToLaunchpad(): void
This will navigate to the Fiori launchpad.  
It will only work if it's a Fiori application.

# Authors
The development is carried out by [Elevatory](https://www.elevatory.de).
We specialize in the development of SAP applications with ABAP, SAPUI5/Fiori and SAP HANA.
