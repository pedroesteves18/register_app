import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
const generateToken = (user,res) => {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.setHeader('Authorization', `Bearer ${token}`);
    return token;
};

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if(!token) {
        return res.status(401).send({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).send({ error: 'Failed to authenticate token' });
        }
        req.user = decoded.id;
        next();
    });
}

export { generateToken, authMiddleware };