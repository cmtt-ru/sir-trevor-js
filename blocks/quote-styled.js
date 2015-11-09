/**
 * Headings with different sizes
 */
SirTrevor.Blocks.QuoteStyled = SirTrevor.Blocks.Quote.extend({

    type: "quote_styled",

    blockOptions: [{name:'size', options:[{text: 'sm', value: 'small', default: true}, {text: 'bg', value: 'big'}]}]
});