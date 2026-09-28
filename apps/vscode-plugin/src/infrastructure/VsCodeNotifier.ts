import { NotifierPort } from "@egon/modeler-core";
import { window } from "vscode";

export class VsCodeNotifier implements NotifierPort {
    warning(message: string): void {
        void window.showWarningMessage(message);
    }

    error(message: string): void {
        void window.showErrorMessage(message);
    }
}
