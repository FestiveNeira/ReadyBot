// Import Helpers
const {
    midnightReset,
    parseTime,
    parseMultiTime,
    getTimeString,
    numReady,
    updateNumReady,
    scanRAL,
    saveRAL,
    checkRAL,
    react,
    channelType
} = require('./helpers.js');

module.exports = {
    specials: new Map([
        //DM Specials
        ['130880023069589505dm', {
            name: 'Jaspa',
            special(message, bot) {
                //dm special
                if (message.channel.type === channelType('dm')) {
                    message.channel.send('❤️');
                }
                //text special
                else if (message.channel.type === channelType('text')) {
                }
            }
        }],

        //Text Specials
        ['111579235059060736text', {
            name: 'Ben',
            special(message, bot) {
                //dm special
                if (message.channel.type === channelType('dm')) {
                }
                //text special
                else if (message.channel.type === channelType('text')) {
                    if (Math.random() < .05) {
                        message.react('🤓');
                    }
                }
            }
        }]
    ])
}