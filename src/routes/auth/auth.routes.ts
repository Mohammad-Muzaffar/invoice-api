import express from 'express';
import { AuthCheckController, LoginController, LogoutController, RefreshController, RegisterController } from '../../controllers/auth.controllers';
import { AuthMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

// public:
router.route('/register').post(RegisterController);
router.route('/login').post(LoginController);

// private:
router.route('/refresh').post(RefreshController);
router.route('/check').get(AuthMiddleware, AuthCheckController);
router.route('/logout').post(AuthMiddleware, LogoutController);


export default router;