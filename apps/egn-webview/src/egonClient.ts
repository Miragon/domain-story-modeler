import minimapModule from "diagram-js-minimap";
import {
  DomainStoryDocument,
  EgonClient,
  ImportRepairData,
  ViewportData,
} from "egon-core";

export interface ModelerClient {
  import(document: DomainStoryDocument): void;
  export(): DomainStoryDocument;
  getViewport(): ViewportData;
  setViewport(viewport: ViewportData): void;
  on(event: "story.changed", callback: () => void): void;
  on(
    event: "viewport.changed",
    callback: (viewport: ViewportData) => void,
  ): void;
  on(
    event: "import.repaired",
    callback: (repair: ImportRepairData) => void,
  ): void;
  off(event: "story.changed", callback: () => void): void;
  off(
    event: "viewport.changed",
    callback: (viewport: ViewportData) => void,
  ): void;
  off(
    event: "import.repaired",
    callback: (repair: ImportRepairData) => void,
  ): void;
  destroy(): void;
}

export type ModelerClientFactory = (
  container: HTMLElement,
) => Promise<ModelerClient>;

/** Production adapter; lifecycle and tests depend only on the public client API. */
export const createEgonClient: ModelerClientFactory = async (container) =>
  EgonClient.create({ container, width: "100%", height: "100%" }, [
    minimapModule,
  ]);
