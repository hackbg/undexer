import sequelize from "../../db/index.js";
import { DataTypes } from "sequelize";

const Header = sequelize.define("section_header", {
    type: {
        type: DataTypes.TEXT,
    },
    chainId: {
        type: DataTypes.TEXT,
    },
    expiration: {
        type: DataTypes.TEXT,
    },
    timestamp: {
        type: DataTypes.TEXT,
    },
    codeHash: {
        type: DataTypes.TEXT,
    },
    dataHash: {
        type: DataTypes.TEXT, 
    },
    memoHash: {
        type: DataTypes.TEXT,
    },
    txType: {
        type: DataTypes.TEXT,
    },
});

export default Header;
