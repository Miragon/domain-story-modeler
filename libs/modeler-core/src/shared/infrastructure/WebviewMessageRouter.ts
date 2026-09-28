export interface TypedMessage {
    readonly type: string;
}

export type MessageHandler<
    Message extends TypedMessage,
    Type extends Message["type"],
    Context,
> = (
    message: Extract<Message, { type: Type }>,
    context: Context,
) => void | Promise<void>;

/**
 * Registration-based dispatch for webview messages. Handlers for a type run
 * sequentially in registration order; an unknown type is a silent no-op.
 */
export class WebviewMessageRouter<Message extends TypedMessage, Context> {
    private readonly handlers = new Map<
        Message["type"],
        Array<(message: Message, context: Context) => void | Promise<void>>
    >();

    on<Type extends Message["type"]>(
        type: Type,
        handler: MessageHandler<Message, Type, Context>,
    ): this {
        const registered = handler as (
            message: Message,
            context: Context,
        ) => void | Promise<void>;
        const existing = this.handlers.get(type);
        if (existing) existing.push(registered);
        else this.handlers.set(type, [registered]);
        return this;
    }

    async dispatch(message: Message, context: Context): Promise<void> {
        const handlers = this.handlers.get(message.type);
        if (!handlers) return;
        for (const handler of handlers) await handler(message, context);
    }
}
