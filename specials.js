
module.exports = {
    specials: new Map([
        //DM Specials
        ['130880023069589505dm', {
            name: 'Jaspa',
            special(message, bot) {
                //dm special
                if (message.channel.type === 'dm') {
                    message.channel.send('❤️');
                }
                //text special
                else if (message.channel.type === 'text') {
                }
            }
        }],

        //Text Specials
        ['111579235059060736text', {
            name: 'Ben',
            special(message, bot) {
                //dm special
                if (message.channel.type === 'dm') {
                }
                //text special
                else if (message.channel.type === 'text') {
                    if (Math.random() < .05) {
                        message.react('🤓');
                    }
                }
            }
        }]
    ])
}