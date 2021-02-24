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
			const card = await Cards.findOne({ where: { name: { [Op.like]: cardname } } });
			if (!card) return message.channel.send(`${message.author}, that card doesn't exist.`);
			return message.channel.send(card.imgUrl);			
	}, 
};