describe("binding", () => {
    it("Odata create", async () => {
         const selector = {
            selector: {
                controlType: "sap.ui.core.mvc.XMLView",
            }
        }
        const view = browser.asControl(selector);   
        console.log("controller: ", view.getController());
    })
})