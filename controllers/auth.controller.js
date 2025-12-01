import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/env.js';
import Users from '../models/user.model.js';

const authorise = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided. Authorization denied." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await Users.findByPk(decoded.id).then(user => {
            if(!user){
                return res.status(401).json({ message: "User not found. Authorization denied." });
            }
            req.user = decoded;
            next();
        }).catch(err => {
            res.status(401).json({ message: "User not found. Authorization denied." });
        });
        
    } catch (error) {
        res.status(401).json({ message: "Invalid token. Authorization denied." });
    }
}

export default authorise;