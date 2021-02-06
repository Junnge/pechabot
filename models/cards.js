module.exports = (sequelize, DataTypes) => {
	return sequelize.define('cards', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		rarity: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		imgUrl: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};