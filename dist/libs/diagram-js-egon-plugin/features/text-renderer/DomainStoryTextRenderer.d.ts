import { Rect } from 'diagram-js/lib/util/Types';
import { TextLayoutConfig } from 'diagram-js/lib/util/Text';

export interface DomainStoryTextRendererStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
}
export interface DomainStoryTextRendererConfig {
    defaultStyle?: Partial<DomainStoryTextRendererStyle>;
    externalStyle?: Partial<DomainStoryTextRendererStyle>;
}
export declare class DomainStoryTextRenderer {
    static $inject: string[];
    private config;
    private textUtil;
    constructor();
    /**
     * Get the new bounds of an externally rendered and arranged label.
     */
    getExternalLabelBounds(bounds: Rect, text: string): Rect;
    /**
     * Get the new bounds of text annotation.
     */
    getTextAnnotationBounds(bounds: Rect, text: string): Rect;
    /**
     * Create an arranged text element.
     *
     * @param {string} text
     * @param {TextLayoutConfig} [options]
     *
     * @return {SVGElement} rendered text
     */
    createText(text: string, options: TextLayoutConfig): SVGElement;
    /**
     * Get the default text style.
     */
    getDefaultStyle(): Partial<DomainStoryTextRendererStyle> | undefined;
    /**
     * Get the external text style.
     */
    getExternalStyle(): Partial<DomainStoryTextRendererStyle> | undefined;
}
