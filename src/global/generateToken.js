import jwt from "jsonwebtoken";

const generateToken = (user,res) => {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.setHeader('Authorization', `Bearer ${token}`);
    return token;
};


export { generateToken };