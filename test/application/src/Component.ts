import UIComponent from "sap/ui/core/UIComponent";
import MessageBox from 'sap/m/MessageBox';
import ODataModel from 'sap/ui/model/odata/v2/ODataModel';

/**
 * @namespace Elevatory.BaseControllerSample
 */

export default class Component extends UIComponent {
	private isMessageOpen: boolean = false;

	public init(): void {
		super.init();
		this.getRouter().initialize();

		this.getModel().attachRequestFailed((event: any) => {
			const response = event.getParameter("response");

			if (response.statusCode !== 404 || (response.statusCode === 404 && response.responseText.indexOf("Cannot POST") === 0)) {
				this.showError(response);
			}
		}, this);
	}

	private showError(response: any) {
		if (this.isMessageOpen) {
			return;
		}

		const responseText = JSON.parse(response.responseText);
		
		const message = responseText && responseText.error && responseText.error.message && responseText.error.message.value ? responseText.error.message.value : response;

		this.isMessageOpen = true;

		MessageBox.error(message, {
			id: "serviceErrorMessageBox",
			onClose: () => this.isMessageOpen = false 
		});

		(this.getModel() as ODataModel).resetChanges();
	}

	public getContentDensityClass(): string {
		return 'sapUiSizeCozy';
	}
}