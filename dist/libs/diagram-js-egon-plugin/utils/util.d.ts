import { Element, Shape } from 'diagram-js/lib/model/Types';

export declare function is(element: Element | undefined, type: string): boolean;
export declare function getBusinessObject(element: Element): any;
export declare function reworkGroupElements(parent: any, shape: Shape): void;
export declare function undoGroupRework(parent: any, shape: Shape): void;
export declare function isCustomIcon(icon: string): boolean;
export declare function isCustomSvgIcon(icon: string): boolean;
/**
 * TODO: This is copied from bpmn-js 8.8.3 and might be simplified because we only use it for rendering annotations
 * ---
 * Scales the path to the given height and width.
 * <h1>Use case</h1>
 * <p>Use case is to scale the content of elements (event, gateways) based
 * on the element bounding box's size.
 * </p>
 * <h1>Why not transform</h1>
 * <p>Scaling a path with transform() will also scale the stroke and IE does not support
 * the option 'non-scaling-stroke' to prevent this.
 * Also there are use cases where only some parts of a path should be
 * scaled.</p>
 *
 * @param {Object} param <p>
 *   Example param object scales the path to 60% size of the container (data.width, data.height).
 *   <pre>
 *   {
 *     xScaleFactor: 0.6,
 *     yScaleFactor:0.6,
 *     containerWidth: data.width,
 *     containerHeight: data.height,
 *     position: {
 *       mx: 0.46,
 *       my: 0.2,
 *     }
 *   }
 *   </pre>
 *   <ul>
 *    <li>targetpathwidth = xScaleFactor * containerWidth</li>
 *    <li>targetpathheight = yScaleFactor * containerHeight</li>
 *    <li>Position is used to set the starting coordinate of the path. M is computed:
 *    <ul>
 *      <li>position.x * containerWidth</li>
 *      <li>position.y * containerHeight</li>
 *    </ul>
 *    Center of the container <pre> position: {
 *       mx: 0.5,
 *       my: 0.5,
 *     }</pre>
 *     Upper left corner of the container
 *     <pre> position: {
 *       mx: 0.0,
 *       my: 0.0,
 *     }</pre>
 *    </li>
 *   </ul>
 * </p>
 *
 */
export declare function getScaledPath(param: any): string;
