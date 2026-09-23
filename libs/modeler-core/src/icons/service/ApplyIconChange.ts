import { IconChange } from "../domain";
import { StoryIcons } from "../../story/domain/StoryIcons";
import {
    parseStoryOrEmpty,
    serializeStory,
} from "../../story/infrastructure/StorySerialization";

export class ApplyIconChange {
    execute(egn: string, change: IconChange): string {
        const doc = parseStoryOrEmpty(egn);
        const storyIcons = new StoryIcons(doc);

        storyIcons.applyChange(change);

        return serializeStory(storyIcons.snapshot());
    }
}
