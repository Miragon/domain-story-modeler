import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { Element } from 'diagram-js/lib/model/Types';

export declare function getLabel(element: Element): any;
export declare function getNumber(element: Element): any;
export declare function setLabel(element: Element, text: string): Element;
export declare function setNumber(element: Element, textNumber: string): Element;
export declare function selectPartOfActivity(waypoints: any, angleActivity: any): number;
export declare function calculateTextWidth(text: string): number;
/**
 * copied from https://www.w3schools.com/howto/howto_js_autocomplete.asp on 18.09.2018
 */
export declare function autocomplete(input: HTMLInputElement, workObjectNames: string[], element: Element, eventBus: EventBus): void;
