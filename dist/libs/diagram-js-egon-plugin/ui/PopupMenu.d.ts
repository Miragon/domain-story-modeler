interface PopupProps {
    x: number;
    y: number;
    label?: string;
    index?: number;
    isMultiple?: boolean;
    displayNumber?: boolean;
    onUpdate: (label: string, index: number | undefined, isMultiple: boolean) => void;
    onCancel: () => void;
}
export default function PopupMenu(props: PopupProps): import('preact').VNode<{}>;
export {};
