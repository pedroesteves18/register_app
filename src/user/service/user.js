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
        const access1 = process.env.DEFAULT_USER_ACCESS;
        const access2 = process.env.DEFAULT_USER_2;

        const users = await User.findAll(); 

        let user1 = null;
        let user2 = null;

        for (const user of users) {
            if (!user1 && await userService.compareAccess(access1, user.access)) {
                user1 = user;
            }
            if (!user2 && await userService.compareAccess(access2, user.access)) {
                user2 = user;
            }
            if (user1 && user2) break;
        }

        let user1Created = false;
        let user2Created = false;

        if (!user1) {
            user1 = await userService.createUser(access1);
            user1Created = true;
        }

        if (!user2) {
            user2 = await userService.createUser(access2);
            user2Created = true;
        }

        return {
            user1,
            user2,
            created: user1Created || user2Created
        };
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