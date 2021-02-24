const { Cards, UserCards, Market } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed } = require('discord.js');
module.exports = {
	name: 'card',
	description: 'shows card info.',
	aliases: ['c'],
	category: 'General',
	args: true,
	usage: '<card name>',
	async execute(message, args) {
			const cardname = args.join(' ');
			const card = await Cards.findAll({ where: { name: { [Op.substring]: cardname } }, include: 'pack', raw: true });
			if (!card) return message.channel.send(`${message.author}, that card doesn't exist.`);
			if (card.length > 1){
				return message.channel.send(`${message.author}, I found ${card.length} cards for your request:\n${card.map(c => `• ${c.name}`).join('\n')}`);	
			} 
			const usercard = await UserCards.findOne({where: {card_id: card[0].id}, raw: true})
			const rar = card[0].rarity;
			const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
			const sellMarket = await Market.findAll({where: {offerType: 'sell', card_id: card[0].id}, order: [['price', 'ASC']], raw: true});
			const buyMarket = await Market.findAll({where: {offerType: 'buy', card_id: card[0].id}, order: [['price', 'DESC']], raw: true});
			const embed = {
				color: rar === 'C' ? '#A5ADB7' : rar === 'R' ? '#5FB5F0' : rar === 'SR' ? '#897CF2' : '#EEDA55',
				fields: [
					{
						name: `${rBadge} ${card[0].name} [ID. ${card[0].id}]`,
						value: `\u200B\nSeries: ${card[0]['pack.name']}\nYou own: ${usercard ? usercard.amount : 0}\n\u200B`,
					}, {
						name: 'Buying offers',
						value: buyMarket.length !== 0 ? `Offers: ${buyMarket.length}\nMax price: ${buyMarket[0].price}` : `No offers`,
						inline: true
					}, {
						name: 'Sale offers',
						value: sellMarket.length !== 0 ? `Offers: ${sellMarket.length}\nMin price: ${sellMarket[0].price}` : `No offers`,
						inline: true
					}
				],
				image: {
					url: card[0].imgUrl,
				}

			}
			return message.channel.send({ embed: embed });		
	}, 
};