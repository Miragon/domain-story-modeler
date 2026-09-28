import {
    IconChangeKind,
    IconService,
    LifetimePort,
    LoggerPort,
    NotifierPort,
} from "@egon/modeler-core";

/** Translates filesystem watcher events into icon application-service calls. */
export class IconWatcherController {
    constructor(
        private readonly icons: IconService,
        private readonly logger: LoggerPort,
        private readonly notifier: NotifierPort,
    ) {}

    async handle(iconId: string, kind: IconChangeKind, lifetime?: LifetimePort): Promise<void> {
        try {
            await this.icons.applyChange(iconId, kind, lifetime);
        } catch (error) {
            if (lifetime?.isRetired) return;
            this.logger.error(`Failed to apply custom icon ${kind}`, error);
            this.notifier.error(
                "A custom icon change could not be applied. See the Egon output for details.",
            );
        }
    }
}
