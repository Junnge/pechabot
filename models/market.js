module.exports = (sequelize, DataTypes) => {
	return sequelize.define('market', {
		user_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		card_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		amount: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		price: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		offerType: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	}, {
		timestamps: false,
	});
};