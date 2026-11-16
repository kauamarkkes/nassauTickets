import jwt from 'jsonwebtoken';
export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erro: 'Token não informado' });
  try {
    req.usuario = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ erro: 'Token inválido' }); }
}
