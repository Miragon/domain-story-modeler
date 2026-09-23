# Custom icons

The VS Code extension loads custom SVG icons from `.egon/icons` directories and
embeds them in each affected `.egn` document. Icons placed nearer to a story in
the workspace hierarchy take part in that story's icon set.

```text
.egon/
└── icons/
    ├── actors/
    │   └── Customer.svg
    └── work-objects/
        └── Order.svg
```

The file name without `.svg` becomes the icon name. Actor icons belong in
`actors`; work-object icons belong in `work-objects`.

Workspace icon creation, changes, and deletion are coordinated by the services
in `libs/modeler-core` and the adapters in `apps/vscode-plugin`. They understand
both supported file shapes:

- EGN v4 stores icons under `iconSet` and elements and metadata under
  `domainStory`.
- Legacy EGN files store icons under `domain` and elements under `dst`.

Icon synchronization preserves the input shape and all story content and
metadata. Editing a legacy story in the modeler and saving it normally exports
the story in EGN v4; files are not migrated in bulk.

The browser modeler, icon sanitization, palette, context pad, and rendering are
provided by the pinned [`egon-core`](https://github.com/Miragon/egon-core)
package. Refer to its documentation for those internals.

## SVG guidance

- Include a `viewBox`, preferably with a square aspect ratio.
- Avoid relying on fixed `width` and `height` values.
- Prefer filled, monochrome paths because icons are rendered as masks.
- Use a unique, descriptive file name.

If an icon does not appear, verify that it is valid SVG, is in the correct
category directory, and that the `.egon` directory is an ancestor of the story.
