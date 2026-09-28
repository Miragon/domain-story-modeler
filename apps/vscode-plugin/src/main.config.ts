import { container } from "tsyringe";
import {
    DocumentPort,
    DomainStoryEditorService,
} from "@egon/modeler-core";
import { VsCodeDocumentPort } from "./infrastructure/VsCodeDocumentPort";

export function config() {
    container.register("DomainStoryModelerViewType", {
        useValue: "egon.io",
    });

    container.register("DomainStoryModelerExtensionId", {
        useValue: "egn",
    });

    container.register<DocumentPort>("DocumentPort", {
        useClass: VsCodeDocumentPort,
    });

    container.register<DomainStoryEditorService>(DomainStoryEditorService, {
        useFactory: (c) => {
            const docs = c.resolve<DocumentPort>("DocumentPort");
            return new DomainStoryEditorService(docs);
        },
    });
}
