import express from "express";
import { Router } from "express";
import * as user from './user-controller.js'

const router = Router()

router.route('/login').get(user.getAllUsers).post(user.addUser).delete(user.deleteAllUsers)
router.route('/login/:id').get(user.getSingleUser)

export default router