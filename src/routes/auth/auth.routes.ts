import express from 'express';

const router = express.Router();

// public:
router.route('/register').post();
router.route('/login').post();

// private:
router.route('/logout').post();


export default router;