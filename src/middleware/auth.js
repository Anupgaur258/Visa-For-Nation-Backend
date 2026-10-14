import jwt from 'jsonwebtoken';
export default function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try {
     req.admin = jwt.verify(t, process.env.JWT_SECRET); next();
   }
  catch{
     res.status(401).json({ message: 'Unauthorized' }); 
    }
}

// here will be our middleware function that will check if the user is authenticated or not.
// authentication middleware 
