import jwt from 'jsonwebtoken'


const authMiddleware = (req, res, next) => {
    let token = req.headers['authorization'];
    if(!token) return res.status(401).send({ error: 'No token provided' });
    token = token.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).send({ error: 'Failed to authenticate token' });
        }
        req.user = decoded.id;
        next();
    });
}

export default authMiddleware