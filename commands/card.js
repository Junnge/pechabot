const { Cards } = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'card',
	description: 'shows card info.',
	aliases: ['c'],
	category: 'General',
	args: true,
	usage: '<card name>',
	async execute(message, args) {
			const cardname = args.join(' ');
			const card = await Cards.findAll({ where: { name: { [Op.substring]: cardname } }, raw: true });
			if (!card) return message.channel.send(`${message.author}, that card doesn't exist.`);
			if (card.length > 1){

				return message.channel.send(`${message.author}, I found ${card.length} cards for your request:\n${card.map(c => `• ${c.name}`).join('\n')}`);	
			} else return message.channel.send(card[0].imgUrl);		
	}, 
};