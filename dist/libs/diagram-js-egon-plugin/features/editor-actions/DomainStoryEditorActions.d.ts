import { DirectEditing } from 'diagram-js-direct-editing';
import { default as HandTool } from 'diagram-js/lib/features/hand-tool/HandTool';
import { default as LassoTool } from 'diagram-js/lib/features/lasso-tool/LassoTool';
import { default as Selection } from 'diagram-js/lib/features/selection/Selection';
import { default as SpaceTool } from 'diagram-js/lib/features/space-tool/SpaceTool';
import { default as ElementRegistry } from 'diagram-js/lib/core/ElementRegistry';
import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { default as EditorActions } from 'diagram-js/lib/features/editor-actions/EditorActions';

export declare class DomainStoryEditorActions {
    private readonly canvas;
    private readonly elementRegistry;
    private readonly selection;
    private readonly spaceTool;
    private readonly lassoTool;
    private readonly handTool;
    private readonly directEditing;
    static $inject: string[];
    constructor(editorActions: EditorActions, canvas: Canvas, elementRegistry: ElementRegistry, selection: Selection, spaceTool: SpaceTool, lassoTool: LassoTool, handTool: HandTool, directEditing: DirectEditing);
    /**
     * select all elements except for the invisible root element
     * @private
     */
    private selectAll;
    private toggleSpaceTool;
    private toggleLassoTool;
    private toggleHandTool;
    private activateDirectEditing;
}
