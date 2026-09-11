import { Connection, Label, Root, Shape } from 'diagram-js/lib/model/Types';
import { DomainStoryIdFactory } from '../id-factory/DomainStoryIdFactory';
import { default as ElementFactory } from 'diagram-js/lib/core/ElementFactory';

export declare class DomainStoryElementFactory extends ElementFactory<Connection, Label, Root, Shape> {
    private readonly domainStoryIdFactory;
    static $inject: string[];
    constructor(domainStoryIdFactory: DomainStoryIdFactory);
    create(type: "label", attrs?: Partial<Label>): Label;
    create(type: "connection", attrs?: Partial<Connection>): Connection;
    create(type: "shape", attrs?: Partial<Shape>): Shape;
    create(type: "root", attrs?: Partial<Root>): Root;
    private getShapeSize;
}
