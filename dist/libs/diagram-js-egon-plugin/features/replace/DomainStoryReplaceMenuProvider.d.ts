import { PopupMenuTarget } from 'diagram-js/lib/features/popup-menu/PopupMenu';
import { default as PopupMenuProvider, PopupMenuEntries, PopupMenuEntriesProvider } from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';
import { DomainStoryReplaceOption } from './DomainStoryReplaceOption';
import { DomainStoryReplace } from './DomainStoryReplace';

export declare class DomainStoryReplaceMenuProvider implements PopupMenuProvider {
    private readonly domainStoryReplace;
    private readonly domainStoryReplaceOption;
    static $inject: string[];
    constructor(domainStoryReplace: DomainStoryReplace, domainStoryReplaceOption: DomainStoryReplaceOption);
    getPopupMenuEntries(target: PopupMenuTarget): PopupMenuEntriesProvider | PopupMenuEntries;
    /**
     * Get all entries from replaceOptions for the given element and apply filters
     * on them. Get, for example, only elements, which are different from the current one.
     * @return a list of menu entry items
     */
    private getEntries;
    /**
     * Creates an array of menu entry objects for a given element and filters the replaceOptions
     * according to a filter function.
     * @return a list of menu items
     */
    private createEntries;
    /**
     * Creates and returns a single menu entry item.
     *
     * @param  definition a single replace options definition object
     * @param  element the element to replace
     * @param  action an action callback function which gets called when
     *         the menu entry is being triggered.
     *
     * @return menu entry item
     */
    private createMenuEntry;
}
