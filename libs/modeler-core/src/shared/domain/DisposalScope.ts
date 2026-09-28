import { DisposablePort } from "./hostPorts";

/**
 * Owns a group of resources and retires them exactly once in reverse order.
 * Resources acquired after retirement are disposed immediately.
 */
export class DisposalScope implements DisposablePort {
    private resources: DisposablePort[] = [];
    private retired = false;

    constructor(private readonly onError: (error: unknown) => void = () => undefined) {}

    get isRetired(): boolean {
        return this.retired;
    }

    add<T extends DisposablePort>(resource: T): T {
        if (this.retired) {
            this.disposeResource(resource);
        } else {
            this.resources.push(resource);
        }
        return resource;
    }

    dispose(): void {
        if (this.retired) return;

        this.retired = true;
        const resources = this.resources;
        this.resources = [];

        for (let index = resources.length - 1; index >= 0; index--) {
            this.disposeResource(resources[index]);
        }
    }

    private disposeResource(resource: DisposablePort): void {
        try {
            resource.dispose();
        } catch (error) {
            try {
                this.onError(error);
            } catch {
                // Cleanup must continue even when error reporting itself fails.
            }
        }
    }
}
