


const verifyAdm = async (req,res,next) => {
    try{
        let secret = req.body.secret
        if(process.env.ADM_SECRET != secret) return res.status(401).send({msg:"You are not allowed"})
        next()
    }catch(err){

    }
}

export default verifyAdm