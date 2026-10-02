import {
    HostApi,
    HostApiImpl,
    WebviewState,
    WebviewToHostMessage,
} from "@egon/modeler-shared";
import { VsCodeMock } from "./mock";

declare const process: { env: { NODE_ENV: string } };

export function getHostApi(): HostApi<WebviewState, WebviewToHostMessage> {
    if (process.env.NODE_ENV === "development") {
        return new VsCodeMock();
    } else {
        return new HostApiImpl<WebviewState, WebviewToHostMessage>();
    }
}
