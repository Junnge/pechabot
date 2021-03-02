const { Cards, UserCards, Market, Users, PacksShop } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed } = require('discord.js');
module.exports = {
	name: 'disenchant',
	description: 'disenchant a card into some coins.',
	aliases: ['dis'],
	category: 'General',
	args: true,
	usage: '<filter>',
	guide: `
The disenchant function is used to destroy cards and get coins for them.
The number of coins depends on the rarity of the card.
(you can specify the filters you need by separating them with &).
Filters:
• \`<card name> <amout>\` - to disenchant a specific card in the specified amount
• \`<auto>\` - disenchanting all your extra cards (that you own more than 1)
• \`<auto> <pack=packname || id>\` - cards only from the specified pack
• \`<auto> <rarity=c || r || sr || ur>\` - only cards of the specified rarity
• \`<all>\` - only cards of the specified rarity
Example: \`[]disenchant pack=1 & pack=c\`
This will disenchant all your **common** cards from **Touhou S1** pack collection.
	`,
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});

		const filter = (reaction, ruser) => {
			return (reaction.emoji.name === '✅' || reaction.emoji.id === '813850876711272478') && ruser.id === user.id;
		};
		
		if (args[0] === 'all') {
			let searchFilter = {
				where: {  
					user_id: user.id
				}, 
				include: {
					model: Cards, 
					as: 'card',
					include: {
						model: PacksShop, 
						as: 'pack'
					}
				}, raw: true
			}

			let obj = {
				'C': { amount: 0 },
				'R': { amount: 0 },
				'SR': { amount: 0 },
				'UR': { amount: 0 },
			};
			let usercard = await UserCards.findAll(searchFilter);
			if (!usercard[0]) return message.channel.send(`${message.author}, you don\'t have any cards do disenchant them.`)
			usercard.map(c => {
				obj[c['card.rarity']].amount += c.amount;
			});
			let embed = {
				color: '#fb7f5c',
				title: `Card disenchanting`,
				description: `Are you sure you want to disenchant ${obj['C'].amount+obj['R'].amount+obj['SR'].amount+obj['UR'].amount} cards?\nYou will receive ${obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100 } coins, but you will destroy:\n${obj['C'].amount > 0 ? `<:C_e2:808832032822132806> x ${obj['C'].amount}\n` : ''}${obj['R'].amount > 0 ? `<:R_e2:808832032909557801> x ${obj['R'].amount}\n` : ''}${obj['SR'].amount > 0 ? `<:SR_e2:808832032997376021> x ${obj['SR'].amount}\n` : ''}${obj['UR'].amount > 0 ? `<:UR_e2:808832032632602656> x ${obj['UR'].amount}\n` : ''}`
			}
			message.channel.send({ embed: embed}).then(async m => {
				await m.react('✅');
				await m.react('<:cancel:813850876711272478>');
				m.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(async collected => {
					const reaction = collected.first();
					if (reaction.emoji.name === '✅') {
						usercard = await UserCards.findAll(searchFilter);
						obj = {
							'C': { amount: 0 },
							'R': { amount: 0 },
							'SR': { amount: 0 },
							'UR': { amount: 0 },
						};
						usercard.map(c => {
							user.setCards(c.card_id, -c.amount);
							obj[c['card.rarity']].amount += c.amount;
						});
						user.balance += obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100;
						await user.save();
						embed.color = '#77B255';
						embed.description = `You have successfully disenchanted ${obj['C'].amount+obj['R'].amount+obj['SR'].amount+obj['UR'].amount} cards for ${obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100 } coins.`;						
					} else {
						embed.color = '#DD2E44';
						embed.description = `Card disenchanting canceled.`;
					}					
					m.reactions.removeAll().catch(e => {});
					m.edit({ embed: embed}).catch(e => {});
				}).catch(err => {
					embed.description = `Timed out. Card disenchanting canceled.`;
					embed.color = '#DD2E44';			
					m.edit({ embed: embed}).catch(e => {});
					m.reactions.removeAll().catch(e => {});
				});		
			}).catch(e => console.log(e));

		} else if (args[0] === 'auto') {
			let searchFilter = {
				where: { 
					amount: { [Op.gt]: 1 }, 
					user_id: user.id
				}, 
				include: {
					model: Cards, 
					as: 'card',
					include: {
						model: PacksShop, 
						as: 'pack'
					}
				}, raw: true
			}

			args = args.slice(1, args.length).join(' ').split('&');
			if (args[0]){
				for (let i = 0; i < args.length; i++){
					let f = args[i].trim().split('=')
					f[0] = f[0].trim();
					if (f[0] === 'pack' || f[0] === 'p'){
						if (f[1]) {
							if (Number.isInteger(+f[1].trim())) {
								searchFilter.where['$card.pack.id$'] = +f[1].trim();
							} else {
								searchFilter.where['$card.pack.name$'] = { [Op.like]: f[1].trim() };
							}	
						}						
					}
					if (f[0] === 'rarity' || f[0] === 'r'){
						if (f[1]) searchFilter.where['$card.rarity$'] = { [Op.like]: f[1].trim() };						
					}
				}
			}

			let obj = {
				'C': { amount: 0 },
				'R': { amount: 0 },
				'SR': { amount: 0 },
				'UR': { amount: 0 },
			};
			let usercard = await UserCards.findAll(searchFilter);
			if (!usercard[0]) return message.channel.send(`${message.author}, you don\'t have any extra cards do disenchant them.`)
			usercard.map(c => {
				obj[c['card.rarity']].amount += c.amount-1;
			});
			let embed = {
				color: '#fb7f5c',
				title: `Card disenchanting`,
				description: `Are you sure you want to disenchant ${obj['C'].amount+obj['R'].amount+obj['SR'].amount+obj['UR'].amount} cards?\nYou will receive ${obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100 } coins, but you will destroy:\n${obj['C'].amount > 0 ? `<:C_e2:808832032822132806> x ${obj['C'].amount}\n` : ''}${obj['R'].amount > 0 ? `<:R_e2:808832032909557801> x ${obj['R'].amount}\n` : ''}${obj['SR'].amount > 0 ? `<:SR_e2:808832032997376021> x ${obj['SR'].amount}\n` : ''}${obj['UR'].amount > 0 ? `<:UR_e2:808832032632602656> x ${obj['UR'].amount}\n` : ''}`
			}
			message.channel.send({ embed: embed}).then(async m => {
				await m.react('✅');
				await m.react('<:cancel:813850876711272478>');
				m.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(async collected => {
					const reaction = collected.first();
					if (reaction.emoji.name === '✅') {
						usercard = await UserCards.findAll(searchFilter);
						obj = {
							'C': { amount: 0 },
							'R': { amount: 0 },
							'SR': { amount: 0 },
							'UR': { amount: 0 },
						};
						usercard.map(c => {
							user.setCards(c.card_id, -c.amount-1);
							obj[c['card.rarity']].amount += c.amount-1;
						});
						user.balance += obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100;
						await user.save();
						embed.color = '#77B255';
						embed.description = `You have successfully disenchanted ${obj['C'].amount+obj['R'].amount+obj['SR'].amount+obj['UR'].amount} cards for ${obj['C'].amount * 5 + obj['R'].amount * 20 +obj['SR'].amount * 50 +obj['UR'].amount * 100 } coins.`;						
					} else {
						embed.color = '#DD2E44';
						embed.description = `Card disenchanting canceled.`;
					}					
					m.reactions.removeAll().catch(e => {});
					m.edit({ embed: embed}).catch(e => {});
				}).catch(err => {
					embed.description = `Timed out. Card disenchanting canceled.`;
					embed.color = '#DD2E44';			
					m.edit({ embed: embed}).catch(e => {});
					m.reactions.removeAll().catch(e => {});
				});		
			}).catch(e => console.log(e));


		} else {
			const amount = Math.abs(Math.floor(+args[args.length-1]));
			const cardname = args.slice(0, args.length-1).join(' ');
			let usercard = await UserCards.findOne({ where: { '$card.name$': { [Op.like]: cardname }, user_id: user.id }, include: 'card', raw: true });
			if (!Number.isInteger(amount)) return message.channel.send(`${message.author}, incorrect amount value.`);
			if (!usercard) return message.channel.send(`${message.author}, incorrect card value.`);
			if (usercard.amount < amount) return message.channel.send(`${message.author}, you dont have enough cards for this.`);
			
			const rar = usercard['card.rarity'];
			const rBadge = rar === 'C' ? '<:C_e2:808832032822132806>' : rar === 'R' ? '<:R_e2:808832032909557801>' : rar === 'SR' ? '<:SR_e2:808832032997376021>' : '<:UR_e2:808832032632602656>';
			const mlt = rar === 'C' ? 5 : rar === 'R' ? 20 : rar === 'SR' ? 50 : 100;

			let embed = {
				color: '#fb7f5c',
				title: `Card disenchanting`,
				description: `Are you sure you want to disenchant ${rBadge}\`${usercard['card.name']}\` x ${amount}?\nYou will receive ${mlt*amount} coins, but the cards will be destroyed.`
			}

			message.channel.send({ embed: embed}).then(async m => {
				await m.react('✅');
				await m.react('<:cancel:813850876711272478>');
				m.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] }).then(async collected => {
					const reaction = collected.first();
					if (reaction.emoji.name === '✅') {
						usercard = await UserCards.findOne({ where: { '$card.name$': { [Op.like]: cardname }, user_id: user.id }, include: 'card', raw: true });
						if (!usercard || usercard.amount < amount) {
							embed.color = '#DD2E44';
							embed.description = `You can’t do this anymore because you don’t have the required cards.\nI’m wondering where they could have gone...`;
							m.reactions.removeAll().catch(e => {});
							return m.edit({ embed: embed}).catch(e => {});
						}

						embed.color = '#77B255';
						embed.description = `You have successfully disenchanted ${rBadge}\`${usercard['card.name']}\` x ${amount} for ${mlt*amount} coins.`;
						await user.setCards(usercard.card_id, -amount);
						user.balance += amount*mlt;
						await user.save();
					} else {
						embed.color = '#DD2E44';
						embed.description = `Card disenchanting canceled.`;
					}					
					m.reactions.removeAll().catch(e => {});
					m.edit({ embed: embed}).catch(e => {});
				}).catch(err => {
					embed.description = `Timed out. Card disenchanting canceled.`;
					embed.color = '#DD2E44';			
					m.edit({ embed: embed}).catch(e => {});
					m.reactions.removeAll().catch(e => {});
				});		
			}).catch(e => console.log(e));
		}		
	}, 
};