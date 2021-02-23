const { Cards } = require('../dbObjects');
const { Op } = require('sequelize');
module.exports = {
	name: 'card',
	description: 'shows card info.',
	aliases: ['c'],
	category: 'General',
	async execute(message, args) {
		if(args.length > 0) {
			const cardname = args.join(' ');
			const card = await Cards.findOne({ where: { name: { [Op.like]: cardname } } });
			if (!card) return message.channel.send(`That card doesn't exist.`);
			return message.channel.send(card.imgUrl);			
		} else {
			return message.channel.send(`Err:Expecting card name in arguments.`);
		}
	}, 
};