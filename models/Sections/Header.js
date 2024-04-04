import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Header = sequelizer.define("header", {
    type: {
        type: DataTypes.STRING,
        
    },
    chainId: {
        type: DataTypes.STRING,
        
    },
    expiration: {
        type: DataTypes.STRING,
        
    },
    timestamp: {
        type: DataTypes.STRING,
        
    },
    codeHash: {
        type: DataTypes.STRING,
        
    },
    dataHash: {
        type: DataTypes.STRING,
        
    },
    memoHash: {
        type: DataTypes.STRING,
        
    },
    txType: {
        type: DataTypes.STRING,
        
    },
});

export default Header;