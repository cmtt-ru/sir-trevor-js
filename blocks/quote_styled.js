/**
 * Headings with different sizes
 */
SirTrevor.Blocks.QuoteStyled = SirTrevor.Blocks.Quote.extend({

    type: "quote_styled",

    blockOptions: [{name:'size', options:[{icon: 'tick', value: 'small', default: true},{icon: 'tick', value: 'big'}]}]
});