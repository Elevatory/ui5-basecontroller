#!/usr/bin/env node

const fsextra = require('fs-extra');
console.log('Hi, my name is Postinstally 🤓')
fsextra.copy(process.cwd() + "/node_modules/@gdc/ui5-basecontroller/src/BaseController.ts", process.cwd() + "/src/resources/@gdc/ui5-basecontroller/BaseController.ts", { recursive: true });
console.log(`I'm done. Hope you are happy.`);