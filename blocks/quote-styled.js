/**
 * Headings with different sizes
 */
SirTrevor.Blocks.QuoteStyled = SirTrevor.Blocks.Quote.extend({

    type: "quote_styled",

    blockOptions: [{name:'size', options:[{icon: '', value: 'small', default: true}, {icon: '', value: 'big'}]}]
});