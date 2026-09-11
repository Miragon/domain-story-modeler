import { IconDictionaryService } from '../../icon-set-config/service/IconDictionaryService';
import { DirtyFlagService } from '../../domain/service/DirtyFlagService';
import { ElementRegistryService } from '../../domain/service/ElementRegistryService';
import { DomainStoryNumberingRegistry } from '../popup/DomainStoryNumberingRegistry';
import { DomainStoryTextRenderer } from '../text-renderer/DomainStoryTextRenderer';
import { Connection, Element, Shape } from 'diagram-js/lib/model/Types';
import { default as BaseRenderer } from 'diagram-js/lib/draw/BaseRenderer';
import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { default as Styles } from 'diagram-js/lib/draw/Styles';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class DomainStoryRenderer extends BaseRenderer {
    private readonly styles;
    private readonly canvas;
    private readonly domainStoryTextRenderer;
    private readonly domainStoryNumberingRegistry;
    private readonly elementRegistryService;
    private readonly dirtyFlagService;
    private readonly iconDictionaryService;
    static $inject: string[];
    private rendererId;
    private markers;
    constructor(eventBus: EventBus, styles: Styles, canvas: Canvas, domainStoryTextRenderer: DomainStoryTextRenderer, domainStoryNumberingRegistry: DomainStoryNumberingRegistry, elementRegistryService: ElementRegistryService, dirtyFlagService: DirtyFlagService, iconDictionaryService: IconDictionaryService);
    canRender(element: Element): boolean;
    drawShape(visuals: SVGElement, shape: Shape): SVGElement;
    getShapePath(shape: Shape): string;
    drawConnection(visuals: SVGElement, connection: Connection): SVGElement;
    drawActor(parent: SVGElement, element: Shape): SVGElement;
    drawWorkObject(parent: SVGElement, element: Shape): SVGElement;
    drawGroup(parentGfx: SVGElement, element: Shape): SVGRectElement;
    drawActivity(visuals: SVGElement, element: Connection): SVGElement;
    drawDSConnection(visuals: SVGElement, element: Connection): SVGElement;
    drawAnnotation(parentGfx: SVGElement, element: Shape): SVGRectElement;
    getActivityPath(connection: Connection): string;
    private getPath;
    private drawRect;
    private drawPath;
    /**
     * creates an SVG path that describes a rectangle which encloses the given shape.
     */
    private getRectPath;
    private getIconSvg;
    private applyColorToCustomSvgIcon;
    private applyColorToIcon;
    private adjustForTextOverlap;
    private useColorForActivity;
    private renderActivityLabel;
    private checkIfPointOverlapsText;
    private getLineOffset;
    private fixConnectionInHTML;
    /**
     * marker functions ("markers" are arrowheads of activities)
     */
    private marker;
    private createMarker;
    private addMarker;
    /**
     * Generate the automatic Number for an activity originating from an actor
     */
    private generateActivityNumber;
    private renderNumber;
    /**
     * render the number associated with an activity
     */
    private renderExternalNumber;
    private numberStyle;
    private setCoordinates;
    /**
     * render a label on the canvas
     */
    private renderLabel;
    private renderActorAndWorkObjectLabel;
    /**
     * determine the X-coordinate of the label / number to be rendered
     */
    private manipulateInnerHTMLXLabel;
    /**
     * determine the Y-coordinate of the label / number to be rendered
     */
    private manipulateInnerHTMLYLabel;
}
