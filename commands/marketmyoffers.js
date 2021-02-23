const { Market, Cards, PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'marketmyoffers',
	description: 'shows your active offers at the market',
	aliases: ['mmo', 'marketmyo', 'mmyo', 'marketmo', 'mmoffers', 'mmyoffers'],
	args: true,
	usage: '<buy || sell>',
	category: 'Market',
	async execute(message, args) {
		const offerType = args[0].toLowerCase() === 's' ? 'sell' : args[0].toLowerCase() === 'b' ? 'buy' : args[0].toLowerCase();
		if (offerType !== 'sell' && offerType !== 'buy' && offerType !== 's' && offerType !== 'b' ) return message.channel.send('You have to specify the offer type!');
		
		let searchFilter = {
			where: { 
				offerType: offerType,
				user_id: message.author.id
			}, include: {
				model: Cards				
			}, raw: true
		}

		let market = await Market.findAll(searchFilter);

		let p = 0;
		const pageSize = 10;
		const mp = market.length % pageSize === 0 ? 0 : Math.floor(market.length/pageSize);
		
		let sendPage = function(page) {
			let le = page == mp ? market.length - mp*pageSize : pageSize;
			let msg = new MessageEmbed().setColor('#fb7f5c').setTitle(`Your market offers for ${offerType}`);
			if (!market[0]) return msg.addFields(
					{
						name: `You currently have no active offers`,
						value: `Try to list your offer using <marketoffer>`
					})
				.setFooter(`Page ${p+1}/${mp+1}`);
		
			let field = [];
			for (let i = 0; i < le; i++){
				const rar = market[page*pageSize+i]['cards.rarity'];
				const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
				field[i] = rBadge + '`' + market[page*pageSize+i]['cards.name'].padEnd(25, ' ') + '` ';
				field[i] += '`' + market[page*pageSize+i]['amount'].padStart(7, ' ') + '` ';
				field[i] += '`' + market[page*pageSize+i]['price'].padStart(6, ' ') + '` ';
				field[i] += '`' + market[page*pageSize+i]['id'].toString().padStart(6, ' ') + '`';
			}
			return msg.addFields(
					{
						name: `Card name\t\t\t\t\t\t\t\t\t\t Amount\tPrice\tOffer ID`,
						value: field, 
						inline: true
					})
				.setFooter(`Page ${p+1}/${mp+1}`);
		}

		message.channel.send(sendPage(p)).then(async (m) => {			
			await m.react('⬅️');
			await m.react('➡️');
			const filter = (reaction, user) => {
				return reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️';
			};
			const collector = m.createReactionCollector(filter, { idle: 30000 });
			collector.on('collect', (reaction, user) => {
				if (reaction.emoji.name === '⬅️'){
					p--;
					if (p < 0) p = mp;
					m.edit(sendPage(p));
				} else if (reaction.emoji.name === '➡️'){
					p++;
					if (p > mp) p = 0;
					m.edit(sendPage(p));
				}
			});

			collector.on('end', collected => {
				m.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
			});
		});
	}
};