const { Market, Cards, PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'market',
	description: 'show market\'s offers',
	aliases: ['m'],
	args: false,
	usage: '<filter>',
	category: 'Market',
	guide: `
The market is the place where you can post offers to sell extra cards or buy the ones you need.
To view the list of active offers use the command []market <filters>
(you can specify the filters you need by separating them with &).
Filters:
• \`<sell || buy>\` - type of offer (for sale or purchase)
• \`<card=cardname || id>\` - the specific card
• \`<pack=packname || id>\` cards only from the specified pack
• \`<rarity=c || r || sr || ur>\` - only cards of the specified rarity
• \`<price>\` - sort offers by price
To create your offer, use \`[]offer <offerType> <cardName> <amount> <price>\`
Example: \`[]offer sell chen 3 100\`
This will put 3 of your cards up for sale at a cost of 100 coins each.
To make a deal, using an active offer, use []offerexecute <offerID> <amount>
	`,
	async execute(message, args) {
		//const offerType = args[0].toLowerCase() === 's' ? 'sell' : args[0].toLowerCase() === 'b' ? 'buy' : args[0].toLowerCase();
		//if (offerType !== 'sell' && offerType !== 'buy' && offerType !== 's' && offerType !== 'b' ) return message.channel.send(`${message.author}, you have to specify the offer type!`);
		
		let searchFilter = {
			where: { 
				
			}, include: {
				model: Cards, 
				include: {
					model: PacksShop, 
					as: 'pack'
				}
			}, raw: true
		}

		args = args.join(' ').split('&');
		console.log(args);
		if (args[0]){
			for (let i = 0; i < args.length; i++){
				let f = args[i].trim().split('=')
				f[0] = f[0].trim();
				console.log(f);
				if (f[0] === 's' || f[0] === 'sell' || f[0] === 'b' || f[0] === 'buy'){
					searchFilter.where['offerType'] = { [Op.startsWith]: f[0].trim() };	
				}
				if (f[0] === 'card' || f[0] === 'c'){
					if (f[1]){
						if (Number.isInteger(+f[1].trim())){
							searchFilter.where['$cards.id$'] = +f[1].trim(); break;
						}
						searchFilter.where['$cards.name$'] = { [Op.substring]: f[1].trim() }; break;
					}
				} else if (f[0] === 'pack' || f[0] === 'p'){
					if (f[1]) {
						if (Number.isInteger(+f[1].trim())){
						searchFilter.where['$cards.pack.id$'] = +f[1].trim();
						} else {
							searchFilter.where['$cards.pack.name$'] = { [Op.substring]: f[1].trim() };
						}	
					}									
				} else if (f[0] === 'rarity' || f[0] === 'r'){
					if (f[1]) searchFilter.where['$cards.rarity$'] = { [Op.like]: f[1].trim() };
					
				}
			}
		}
		let market = await Market.findAll(searchFilter);
		let p = 0;
		const pageSize = 10;
		const mp = market.length % pageSize === 0 ? 0 : Math.floor(market.length/pageSize);
		
		let sendPage = function(page) {
			let le = page == mp ? market.length - mp*pageSize : pageSize;
			let msg = new MessageEmbed().setColor('#fb7f5c').setTitle(`Market offers`);
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
				field[i] += '`' + market[page*pageSize+i]['id'].toString().padStart(6, ' ') + '` ';
				field[i] += '`' + market[page*pageSize+i]['offerType'].toString().padEnd(5, ' ') + '` ';
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
			collector.on('collect', async (reaction, user) => {
				if (reaction.emoji.name === '⬅️'){
					p--;
					if (p < 0) p = mp;
					m.edit(sendPage(p));
				} else if (reaction.emoji.name === '➡️'){
					p++;
					if (p > mp) p = 0;
					m.edit(sendPage(p));
				}
				const userReactions = m.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
				try {
					for (const reaction of userReactions.values()) {
						await reaction.users.remove(user.id);
					}
				} catch (error) {
					console.error('Failed to remove reactions.');
				}
			});

			collector.on('end', collected => {
				m.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
			});
		});
	}
};