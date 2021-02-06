const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});


const Users 		= require('./models/users')(sequelize, Sequelize.DataTypes);
const PacksShop = require('./models/packsShop')(sequelize, Sequelize.DataTypes);
const UserCards = require('./models/userCards')(sequelize, Sequelize.DataTypes);
const UserPacks = require('./models/userPacks')(sequelize, Sequelize.DataTypes);
const Cards 		= require('./models/cards')(sequelize, Sequelize.DataTypes); 

UserPacks.belongsTo(PacksShop, { foreignKey: 'pack_id', as: 'pack' });
UserCards.belongsTo(Cards, { foreignKey: 'card_id', as: 'card'});
PacksShop.hasMany(Cards);

Users.prototype.getPacks = async function() {
	return UserPacks.findAll({
			where: { user_id: this.id },
			include: ['pack'],
		});
};
Users.prototype.getCards = async function() {
	return UserCards.findAll({ 
		where: { user_id: this.id },
		include: ['card'],
	});
}
Users.prototype.setPacks = async function(pack, amount){
	const userpack = await UserPacks.findOne({ where: {user_id: this.id, pack_id: pack.id } });
	if (userpack) {
		userpack.amount += amount;
		if (userpack.amount == 0) return userpack.destroy();
		return userpack.save();
	}
	return UserPacks.create({ user_id: this.id, pack_id: pack.id, amount: amount });
}
Users.prototype.setCards = async function(card, amount){
	const usercard = await UserCards.findOne({ where: {user_id: this.id, card_id: card.id} });
	if (usercard) {
		usercard.amount += amount;
		if (usercard.amount == 0) return await usercard.destroy();
		return await usercard.save();
	}
	return UserCards.create({ user_id: this.id, card_id: card.id, amount: amount});
}

module.exports = { Users, PacksShop, UserCards, UserPacks, Cards };