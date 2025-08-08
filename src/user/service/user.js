import User from '../model/user.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
const userService = {
    hashAccess: async (access) =>{
        const saltRounds = parseInt(process.env.ROUNDS)
        const hashedAccess = await bcrypt.hash(access, saltRounds);
        return hashedAccess;
    },
    compareAccess: async (access, hashedAccess) => {   
        return await bcrypt.compare(access, hashedAccess);
    },
    createUser: async (access) => {
        const hashedAccess = await userService.hashAccess(access);
        const user = await User.create({ access: hashedAccess });
        return user;
    },
    fetchme: async (id) => {
        const user = await User.findByPk(id);
        if (!user) {
           throw new Error('User not found');
        }
        return user;
    },
    createDefaultUser: async () => {
        const access = process.env.DEFAULT_USER_ACCESS;
        if (!access) {
            throw new Error('Default user access not defined in environment variables');
        }
        const user = await userService.createUser(process.env.DEFAULT_USER_ACCESS);
        console.log(user.access)
        return user;
    },
    login: async (access) => {
        const users = await User.findAll()
        for(const user of users){
            const isMatch = await userService.compareAccess(access, user.access);
            if (isMatch) {
                return user;
            }
        }
        return null

    }
}

export default userService