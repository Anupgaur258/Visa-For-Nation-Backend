import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import connectDB from './src/config/db.js';
import publicRoutes from './src/routes/public.js';
import adminRoutes from './src/routes/admin.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
const clientOrigins = (process.env.CLIENT_URL || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
	origin(origin, callback) {
		const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
		callback(null, !origin || clientOrigins.length === 0 || clientOrigins.includes(origin) || localDevOrigin);
	},
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
const uploadsRoot = path.resolve('uploads');
app.get('/uploads/:filename', (req, res, next) => {
	const filename = path.basename(req.params.filename);
	res.sendFile(path.join(uploadsRoot, 'legacy', filename), error => { if (error) next(); });
});
app.use('/uploads', express.static(uploadsRoot));
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Server error' }); });

connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log(`API running on :${process.env.PORT || 5000}`)));
