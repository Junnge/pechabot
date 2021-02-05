const UserObj = (require('../classes/User.js'));
const { Cards } = require('../dbObjects');
const { PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { Client, MessageAttachment } = require('discord.js');
module.exports = {
	name: 'card',
	description: 'shows card info.',
	aliases: ['c'],
	async execute(message, args) {
		if(args.length > 0) {
			const cardname = args.join(' ');
			const card = await Cards.findOne({ where: { name: { [Op.like]: cardname } } });
			if (!card) return message.channel.send(`That card doesn't exist.`);
			const pack = await PacksShop.findOne({ where: { id: card.packsShopId }});
			const img = new MessageAttachment('./cardsimg/'+pack.name+'/'+card.name+'.png');
			return message.channel.send(`${card.name} ${card.rarity} ${pack.name}`, img);			
		} else {
			return message.channel.send(`Err:Expecting card name in arguments.`);
		}
	}, 
};