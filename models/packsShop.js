module.exports = (sequelize, DataTypes) => {
	return sequelize.define('packs_shop', {
		name: {
			type: DataTypes.STRING,
			unique: true,
		},
		price: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		onSale: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};