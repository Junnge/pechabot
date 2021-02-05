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


module.exports = { Users, PacksShop, UserCards, UserPacks, Cards };