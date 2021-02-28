const { Cards, UserCards, Market, Users } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageEmbed } = require('discord.js');
module.exports = {
	name: 'disenchant',
	description: 'disenchant a card into some coins.',
	aliases: ['dis'],
	category: 'General',
	args: true,
	usage: '<card name> <amount>',
	async execute(message, args) {
		const [user, created] = await Users.findOrCreate({where: {id: message.author.id}});
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
			const filter = (reaction, ruser) => {
				return (reaction.emoji.name === '✅' || reaction.emoji.id === '813850876711272478') && ruser.id === user.id;
			};
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
		
	}, 
};