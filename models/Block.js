
import { DataTypes } from 'sequelize';

const Block = {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    header: {
        type: DataTypes.JSON,
        allowNull: false,
    },
};

export default Block;