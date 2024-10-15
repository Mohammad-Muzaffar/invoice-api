import express from 'express';
import { LoginController, LogoutController, RegisterController } from '../../controllers/auth.controllers';
import { AuthMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

// public:
router.route('/register').post(RegisterController);
router.route('/login').post(LoginController);

// private:
router.route('/logout').post(AuthMiddleware, LogoutController);


export default router;