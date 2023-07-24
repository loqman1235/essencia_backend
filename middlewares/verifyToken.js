import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
  // Retreive the token from the cookies
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not Authorized" });
  }

  const token = authorizationHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded payload to the request object
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default verifyToken;
