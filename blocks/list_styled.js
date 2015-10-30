/**
 * List with different sizes
 */
SirTrevor.Blocks.ListStyled = SirTrevor.Blocks.List.extend({

    type: "list_styled",

    blockOptions: [{name:'List types',options:[{text: 'ul', value: 'ul', default: true},{text: 'ol', value: 'ol'}]}],

    _serializeData: function() { // add options to list's serializer
        var data = {format: 'html', listItems: []};

        this.editorIds.forEach(function(editorId) {
            var listItem = {content: this.getTextEditor(editorId).scribe.getContent()};
            data.listItems.push(listItem);
        }.bind(this));

        this.$option.filter('input').each(function(key, val){
            var name = $(val).attr('name');
            var value = $(val).val();
            data[name] = value;
        });

        return data;
    },

    beforeLoadingData: function() {
        this.setupListVariables();

        this.loadData(this._getData());
        this.loadOptions(this._getData());
    }
});