import { Icon } from "../domain";
import { StoryIcons } from "../../story/domain/StoryIcons";
import {
    parseStoryOrEmpty,
    serializeStory,
} from "../../story/infrastructure/StorySerialization";

export class SyncIconsFromSet {
    execute(currentEgn: string | undefined, icons: Icon[]): string {
        const doc = parseStoryOrEmpty(currentEgn);
        const storyIcons = new StoryIcons(doc);

        for (const icon of icons) {
            storyIcons.addOrUpdate(icon);
        }

        return serializeStory(storyIcons.snapshot());
    }
}
