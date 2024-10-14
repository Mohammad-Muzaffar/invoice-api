import express from 'express';
import { RegisterController } from '../../controllers/auth.controllers';

const router = express.Router();

// public:
router.route('/register').post(RegisterController);
router.route('/login').post();

// private:
router.route('/logout').post();


export default router;