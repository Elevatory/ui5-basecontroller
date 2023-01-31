import MockServer from 'sap/ui/core/util/MockServer';

/**
 * @namespace Elevatory.BaseControllerSample.mocks
 */


console.log('Starting mock server');

const mockServer = new MockServer({
    rootUri: '/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/'
});

mockServer.simulate('./mocks/metadata.xml', {
    bGenerateMissingMockData: true
});

mockServer.start();

console.log('Mock server started');

sap.ui.require(['sap/ui/core/ComponentSupport']);
