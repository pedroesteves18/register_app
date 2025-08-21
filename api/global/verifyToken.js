import jwt from 'jsonwebtoken'


const authMiddleware = (req, res, next) => {
    console.log('Middleware - Headers:', req.headers)
    console.log('Middleware - Authorization header:', req.headers['authorization'])
    
    let token = req.headers['authorization'];
    if(!token) {
        console.log('Middleware - No token provided')
        return res.status(401).send({ error: 'No token provided' });
    }
    
    token = token.split(' ')[1];
    console.log('Middleware - Token extracted:', token)
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) {
            console.log('Middleware - Token verification failed:', err.message)
            return res.status(401).send({ error: 'Failed to authenticate token' });
        }
        console.log('Middleware - Token verified, user ID:', decoded.id)
        req.user = decoded.id;
        next();
    });
}

export default authMiddleware