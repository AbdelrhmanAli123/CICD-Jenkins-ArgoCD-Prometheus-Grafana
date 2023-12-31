import { User } from "../../DB/mongo-model/user.model.js";


export const getAllUsers = async (req,res,next)=>{
    try{
        const usersData = await User.find()
        res.status(200).json({
            message: "hi, the api works fine",
            usersData
        })
    } catch (err){
        res.status(400).json({
            message : "there is an error",
            err
        })
    }

}
        

export const getSingleUser = async (req,res,next)=>{
    try{

        const id = req.params.id
        const userData = await User.findById(id)
        res.status(200).json({
            message: "hi, the api works fine",
            usersData
        })
    } catch (err){
        res.status(400).json({
            message: "There is an error",
            err
        })
    }
}



export const addUser = async (req,res,next)=>{

    try{

        const userName = req.body.userName
        const IP = req.ip.replace(/^::ffff:/, '');
        const addUser = await User.create({
            userName,
            IP
        })
        res.status(200).json({
            message: "user added successfully",
            addUser
        })
    } catch (err){
        res.status(400).json({
            message: "There is an error",
            err
        })
    }
}

export const deleteAllUsers = async (req,res)=>{
    await User.deleteMany()
    res.status(200).json({
        message : "All users have deleted successfully"
    })
}