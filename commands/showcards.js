const { Users } = require('../dbObjects');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'showcards',
	description: 'shows cards in your inventory.',
	aliases: ['sc'],
	category: 'User',
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		user.getCards().then(cards =>{
			if (!cards.length) return message.channel.send(`You don't have any cards!`);			
			if (args[0] == 'a') cards.sort((a, b) => (a.amount < b.amount) ? 1 : (a.card.name === b.card.name) ? ((a.size > b.size) ? 1 : -1) : -1 );
			if (args[0] == 'r') cards.sort((a, b) => (a.card.rarity > b.card.rarity) ? 1 : (a.card.rarity === b.card.rarity) ? ((a.card.name > b.card.name) ? 1 : -1) : -1 );
			if (args[0] == 'r-') cards.sort((a, b) => (a.card.rarity < b.card.rarity) ? 1 : (a.card.rarity === b.card.rarity) ? ((a.card.name < b.card.name) ? 1 : -1) : -1 );

			let p = 0;
			const pageSize = 15;
			let mp = cards.length % pageSize === 0 ? 0 : Math.floor(cards.length/pageSize);
			let sendPage = function(page) {
				let c = [];
				let le = page == mp ? cards.length - mp*pageSize : pageSize;
				for (let i = 0; i < le; i ++){
					const rar = cards[page*pageSize+i].card.rarity;
					const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
					c[i] = `${rBadge} ${cards[page*pageSize+i].card.name} ${cards[page*pageSize+i].amount > 1 ? 'x '+cards[page*pageSize+i].amount : ''}`
				}
				return new MessageEmbed()
				.setColor('#fb7f5c')
				.setAuthor(message.author.username+'\'s cards collection', message.author.avatarURL())
				.setDescription(c)
				.setFooter(`Page ${p+1}/${mp+1}`);
			}			

			return message.channel.send(sendPage(p)).then(async (m) => {			
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
		}).catch((e) => {console.log(e)});
	},
};