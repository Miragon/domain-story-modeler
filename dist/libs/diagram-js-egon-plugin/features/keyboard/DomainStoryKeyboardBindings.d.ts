import { default as EditorActions } from 'diagram-js/lib/features/editor-actions/EditorActions';
import { default as Keyboard } from 'diagram-js/lib/features/keyboard/Keyboard';

export declare class DomainStoryKeyboardBindings {
    private readonly keyboard;
    private readonly editorActions;
    static $inject: string[];
    constructor(keyboard: Keyboard, editorActions: EditorActions);
    private addListener;
    private selectAll;
    private toggleSpaceTool;
    private toggleLassoTool;
    private toggleHandTool;
    private activateDirectEditing;
}
