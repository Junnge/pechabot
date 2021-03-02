const { PacksShop } = require('../dbObjects');
const { Users } = require('../dbObjects');
const { UserPacks } = require('../dbObjects');
const { Op } = require('sequelize');
const { MessageAttachment } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

module.exports = {
	name: 'openpack',
	description: 'use this to open pack and get your SSR (commons).',
	aliases: ['op'],
	args: true,
	usage: '<pack\'s ID or name>',
	category: 'Packs',
	async execute(message, args) {
		if(args.length > 0) {
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
			if (!pack) return message.channel.send(`${message.author}, this pack doesn't exist. To see list of available packs use []buypacks list`);

			let user = await Users.findOne({ where: { id: message.author.id }});
			if (user === null){
				user = await Users.create({ id: message.author.id });
				console.log('New User created!');
			}

			const userpack = await UserPacks.findOne({ where: { user_id: user.id, pack_id: pack.id }});
			if (!userpack) return message.channel.send(`${message.author}, you don't have any of these packs.`);

			const commons = await pack.getCards({ where: { rarity: 'C'}});
			const rares = await pack.getCards({	where: { rarity: 'R'}});
			const superrares = await pack.getCards({ where: { rarity: 'SR'}});
			const ultrarares = await pack.getCards({ where: { rarity: 'UR'}});

			let loot = [];
			for (let i = 0; i < 5; i++){
				let maxR = 100;
				let rarity = Math.floor(Math.random() * Math.floor(100));
				if (rarity < maxR) maxR = rarity;
				if (i == 4 && maxR >= 50) rarity = 49;
				if (rarity >= 50) {
					loot[i] = commons[Math.floor(Math.random() * Math.floor(commons.length))]
				} else if (rarity >= 13) {
					loot[i] = rares[Math.floor(Math.random() * Math.floor(rares.length))]
				} else if (rarity >= 1 ) {
					loot[i] = superrares[Math.floor(Math.random() * Math.floor(superrares.length))]
				} else {
					loot[i] = ultrarares[Math.floor(Math.random() * Math.floor(ultrarares.length))]
				}
			}
		
			for (let i = 0; i < loot.length; i++){
				await user.setCards(loot[i].id, 1);
			}
			user.setPacks(pack, -1);

			const width = 225;
			const height = 350;
			const canvas = await createCanvas(width*4, 490);
			const context = await canvas.getContext('2d');
			let img = await loadImage(loot[0].imgUrl);
			await context.rotate(315 * Math.PI / 180)
			await context.drawImage(img, -165, 170);
			await context.setTransform(1, 0, 0, 1, 0, 0);
			img = await loadImage(loot[1].imgUrl);
			await context.rotate(337 * Math.PI / 180)
			await context.drawImage(img, 105, 150);
			await context.setTransform(1, 0, 0, 1, 0, 0);
			img = await loadImage(loot[2].imgUrl);
			await context.rotate(45 * Math.PI / 180)
			await context.drawImage(img, 570, -465);
			await context.setTransform(1, 0, 0, 1, 0, 0);
			img = await loadImage(loot[3].imgUrl);
			await context.rotate(22 * Math.PI / 180)
			await context.drawImage(img, 500, -195);
			await context.setTransform(1, 0, 0, 1, 0, 0);
			img = await loadImage(loot[4].imgUrl);
			await context.drawImage(img, width*2-width/2, 20);
			const buffer = new MessageAttachment(canvas.toBuffer());
			return message.channel.send(`${message.author}`, buffer);
		} 
	}, 
};