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