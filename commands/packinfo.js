const { PacksShop, Users, Cards, UserCards } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'packinfo',
	description: 'shows pack cards.',
	aliases: ['pi'],
	args: true,
	usage: '<pack\'s ID or name>',
	category: 'Packs',
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		let packname = '';
		let pack;
		for (let i = 0; i < args.length; i++){
			packname += args[i]+' ';
		}
		packname = packname.slice(0, -1);
		if (Number.isInteger(+packname)) {
			pack = await PacksShop.findOne({ where: { id: { [Op.like]: packname} } });
		} else {
			pack = await PacksShop.findOne({ where: { name: { [Op.like]: packname} } });
		}
		if (!pack) return message.channel.send(`${message.author}, that pack doesn't exist. To see list of available packs use []buypacks list`);

		const cards = await pack.getCards();
		const usercards = await UserCards.findAll({where: {user_id: user.id}, raw: true, include: {association: 'card', where: {packsShopId: pack.id}}});
		usercards.sort((a, b) => a.card_id - b.card_id);
		let cProgress = usercards.length;
		let cPercent = Math.floor(usercards.length*100/cards.length);
		for (let i = 0; i < cards.length; i++){
			if (!usercards[i]) usercards.splice(i, 0, 'empty');
			if (cards[i].id !== usercards[i]['card.id']) usercards.splice(i, 0, 'empty');
		}

		let p = 0;
		const pageSize = 15;
		const mp = cards.length % pageSize === 0 ? 0 : Math.floor(cards.length/pageSize);
		let sendPage = function(page) {
			let c = [];
			let le = page == mp ? cards.length - mp*pageSize : pageSize;
			for (let i = 0; i < le; i++){
				const rar = cards[page*pageSize+i].rarity;
				const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
				c[i] = `${rBadge} ${cards[page*pageSize+i].name}`;
				if (usercards[page*pageSize+i].amount) c[i] += '**   ** **✓**'
			}
			return new MessageEmbed()
			.setColor('#fb7f5c')
			.setTitle(pack.name+' pack')
			.addFields(
				{name: 'Progress '+cPercent+'% ('+cProgress+'/'+cards.length+')', value: c, inline: true},
			)
			
			.setFooter(`Page ${p+1}/${mp+1}`);
		}			

		return message.channel.send(sendPage(p)).then(async (m) => {			
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
	}, 
};