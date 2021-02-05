const UserObj = (require('../classes/User.js'));
const { PacksShop } = require('../dbObjects');
const { Cards } = require('../dbObjects');
const { Op } = require('sequelize');
const { UserPacks } = require('../dbObjects');
module.exports = {
	name: 'openpack',
	description: 'use this to open pack and get your SSR (commons).',
	aliases: ['op'],
	async execute(message, args) {
		if(args.length > 0) {
			const pack = await PacksShop.findOne({ where: { id: { [Op.like]: args[0]} } });
			if (!pack) return message.channel.send(`That pack doesn't exist. To see list of available packs use []buypacks list`);
			const User = new UserObj(message.author);
			user = await User.get();
			if (user === null){
				await User.create();
				user = await User.get();
			}
			const userpack = await UserPacks.findOne({ where: { user_id: User.user.id, pack_id: pack.id }});
			if (!userpack) return message.channel.send(`You don't have any of these packs.`);
			const commons = await pack.getCards({where: { rarity: 'C'}});
			const rares = await pack.getCards({where: { rarity: 'R'}});
			const superrares = await pack.getCards({where: { rarity: 'SR'}});
			const ultrarares = await pack.getCards({where: { rarity: 'UR'}});

			let loot = [];
			for (let i = 0; i < 5; i++){
				let rarity = Math.floor(Math.random() * Math.floor(100));
				if (rarity >= 50) {
					loot[i] = commons[Math.floor(Math.random() * Math.floor(commons.length))]
				} else if (rarity < 50 && rarity >= 13) {
					loot[i] = rares[Math.floor(Math.random() * Math.floor(rares.length))]
				} else if (rarity < 13 && rarity >= 3 ) {
					loot[i] = superrares[Math.floor(Math.random() * Math.floor(superrares.length))]
				} else {
					loot[i] = ultrarares[Math.floor(Math.random() * Math.floor(ultrarares.length))]
				}
				//console.log(rarity);
			}
			//console.log(loot);
			loot.forEach(async c => {await User.setCards(c, 1)});			
			User.setPacks(pack, -1);
			return message.channel.send(loot.map(card => `[${card.rarity}]${card.name}`).join('\n'), { code: true });
		} 
	}, 
};