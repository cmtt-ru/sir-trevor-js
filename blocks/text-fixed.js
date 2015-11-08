SirTrevor.Blocks.TextFixed = SirTrevor.Blocks.Text.extend({

    type: "text_fixed",
    deletable: false,
    movable: false,
    toolbarEnabled: false,

    scribeOptions: {
        allowBlockElements: true,
        tags: {
            p: true,
            br: false,
            i: false,
            b: false
        }
    },

    excludeFormats: {'bold': true, 'italic': true}
});