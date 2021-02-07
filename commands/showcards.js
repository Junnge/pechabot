const { Users } = require('../dbObjects');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'showcards',
	description: 'shows cards in your inventory.',
	aliases: ['sc'],
	async execute(message, args) {
		let user = await Users.findOne({ where: { id: message.author.id }});
		if (user === null){
			user = await Users.create({ id: message.author.id });
			console.log('New User created!');
		}
		user.getCards().then(cards =>{
			if (!cards.length) return message.channel.send(`You don't have any cards!`);
			cards.sort((a, b) => (a.card.name > b.card.name) ? 1 : (a.card.name === b.card.name) ? ((a.size > b.size) ? 1 : -1) : -1 );
			
			let p = 0;
			let mp = Math.floor(cards.length/10);
			let sendPage = function(page) {
				let c = [];
				let le = page == mp ? cards.length - mp*10 : 10;
				for (let i = 0; i < le; i ++){
					c[i] = `${cards[page*10+i].card.name} - ${cards[page*10+i].amount}`
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
					console.log(`Collected ${collected.size} items`);
				});
			});
		}).catch((e) => {console.log(e)});
	},
};