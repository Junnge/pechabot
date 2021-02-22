const { Market, Cards, PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'market',
	description: 'show market\'s offers',
	aliases: ['m'],
	args: true,
	usage: '<sell || buy> <filter>',
	async execute(message, args) {
		const offerType = args[0].toLowerCase() === 's' ? 'sell' : args[0].toLowerCase() === 'b' ? 'buy' : args[0].toLowerCase();
		if (offerType !== 'sell' && offerType !== 'buy' && offerType !== 's' && offerType !== 'b' ) return message.channel.send('You have to specify the offer type!');
		
		let searchFilter = {
			where: { 
				offerType: offerType
			}, include: {
				model: Cards, 
				include: {
					model: PacksShop, 
					as: 'pack'
				}
			}, raw: true
		}

		args = args.slice(1,args.length).join(' ').split('&');
		if (args[0]){
			for (let i = 0; i < args.length; i++){
				let f = args[i].trim().split('=')
				f[0] = f[0].trim(); f[1] = f[1].trim();
				if (f[0] === 'card' || f[0] === 'c'){
					if (Number.isInteger(+f[1].trim())){
						searchFilter.where['$cards.id$'] = +f[1].trim(); break;
					}
					searchFilter.where['$cards.name$'] = { [Op.like]: f[1].trim() }; break;
				} else if (f[0] === 'series' || f[0] === 's'){
					if (Number.isInteger(+f[1].trim())){
						searchFilter.where['$cards.pack.id$'] = +f[1].trim();
					} else {
						searchFilter.where['$cards.pack.name$'] = { [Op.like]: f[1].trim() };
					}					
				} else if (f[0] === 'rarity' || f[0] === 'r'){
					searchFilter.where['$cards.rarity$'] = { [Op.like]: f[1].trim() };
				}
			}
		}
		let market = await Market.findAll(searchFilter);

		let p = 0;
		const pageSize = 10;
		const mp = market.length % pageSize === 0 ? 0 : Math.floor(market.length/pageSize);
		
		let sendPage = function(page) {
			let le = page == mp ? market.length - mp*pageSize : pageSize;
			let msg = new MessageEmbed().setColor('#fb7f5c').setTitle(`Market offers for ${offerType}`);
			if (!market[0]) return msg.addFields(
					{
						name: `No active offers currently`,
						value: `Great moment to be listed first!`
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