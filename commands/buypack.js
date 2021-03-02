const { PacksShop } = require('../dbObjects');
const { Users } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed, createReactionCollector } = require('discord.js');
module.exports = {
	name: 'buypack',
	description: 'buying some packs',
	aliases: ['bp'],
	usage: '<pack\'s ID or name> <amount>',
	category: 'Packs',
	args: true,
	async execute(message, args) {
		if(args[0] != 'list') {
			let amount = 1;
			let packname = '';
			let pack;
			if (args.length > 1) {
				if (Number.isInteger(+args[args.length - 1]) && args[args.length - 1] > 0){
					amount = +args[args.length - 1];
					args = args.slice(0, -1);
				} 
			}	
			for (let i = 0; i < args.length; i++){
				packname += args[i]+' ';
			}
			packname = packname.slice(0, -1);
			if (Number.isInteger(+packname)) {
				pack = await PacksShop.findOne({ where: { id: { [Op.like]: packname} } });
			} else {
				pack = await PacksShop.findOne({ where: { name: { [Op.like]: packname} } });
			}
			if (!pack) return message.channel.send(`${message.author}, that pack doesn't exist. To see list of available packs use []buypack list`);
			
			const [user, ucreated] = await Users.findOrCreate({where: {id: message.author.id}});

			if (pack.price*amount > user.balance){
				return message.channel.send(`${message.author}, you currently have only ${user.balance} coins, you need ${pack.price*amount} coins to make this purchase.`);
			}
			if (!pack.onSale) {
				return message.channel.send(`${message.author}, this pack is currently unavailable.`);
			}
			user.balance -= amount*pack.price;
			Promise.all([
				user.setPacks(pack, +amount),
				user.save()
			]).then(()=>{
				message.channel.send(`${message.author}, ${amount} "${pack.name}" ${amount == 1 ? 'pack was' : 'packs were'} bought.`);
			}).catch((e) => {console.log(e)});
		} else {
			const shop = await PacksShop.findAll({ where: { onSale: true }});
			let p = 0;
			const pageSize = 10;
			const mp = shop.length % pageSize === 0 ? 0 : Math.floor(shop.length/pageSize);
			
			let sendPage = function(page) {
				let le = page == mp ? shop.length - mp*pageSize : pageSize;
				let msg = new MessageEmbed().setColor('#fb7f5c').setTitle(`Packs shop`);
				if (!shop[0]) return msg.addFields(
						{
							name: `No packs on sale`,
							value: `Come back later.`
						})
					.setFooter(`Page ${p+1}/${mp+1}`);
			
				let field = [];
				for (let i = 0; i < le; i++){
					field[i] =  `\`[${shop[page*pageSize+i].id}]\` `
					field[i] += `\`${shop[page*pageSize+i].name.padEnd(25, ' ')}\` `
					field[i] += `\`${shop[page*pageSize+i].price.toString().padStart(5, ' ')}\` `
				}
				return msg.addFields(
						{
							name: `ID.\tPack name\t\t\t\t\t\t\t\t\tPrice`,
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
	}, 
};