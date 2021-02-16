const { PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'packinfo',
	description: 'shows pack cards.',
	aliases: ['pi'],
	args: true,
	usage: '<pack\'s ID or name>',
	async execute(message, args) {
		if(args.length > 0 && args[0] != 'list') {
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
			if (!pack) return message.channel.send(`That pack doesn't exist. To see list of available packs use []buypacks list`);

			pack.getCards().then(cards =>{
				let p = 0;
				let pageSize = 15;
				let mp = cards.length % pageSize === 0 ? 0 : Math.floor(cards.length/pageSize);
				let sendPage = function(page) {
					let c = [];
					let le = page == mp ? cards.length - mp*pageSize : pageSize;
					for (let i = 0; i < le; i ++){
						const rar = cards[page*pageSize+i].rarity;
						const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
						c[i] = `${rBadge} ${cards[page*pageSize+i].name}`
					}
					return new MessageEmbed()
					.setColor('#fb7f5c')
					.setAuthor(pack.name)
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
		}
	}, 
};