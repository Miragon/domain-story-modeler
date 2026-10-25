# Custom icons

The VS Code extension loads custom SVG icons from `.egon/icons` directories and
embeds them in open `.egn` documents. It scans from the story's directory up to
its containing workspace root. A nearer directory wins when icon names collide;
within one directory, the first SVG path in lexicographic order wins.

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

Icon creation, changes, and deletion refresh already-open story buffers, including
text editors and modeler editors. The change is an undoable editor edit that marks
the buffer dirty; Save or Auto Save persists it. Closed stories are not opened or
changed. Stories outside workspace folders retain their embedded icons.

The extension tracks which SVG supplied each icon for the current open session.
After an observed deletion, it first looks for an ancestor icon with the same
name. Otherwise, it removes an icon only when its embedded SVG still matches the
last synchronized SVG. Manual edits and unrelated embedded icons remain. Closing
the document clears this tracking; reopening after an offline deletion preserves
the embedded icon.

The services understand both supported file shapes:

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
