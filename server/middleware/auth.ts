import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Simple authentication middleware that extracts user information
 * from request headers and attaches it to the request object
 * 
 * In a production environment, this would validate JWT tokens,
 * session cookies, or other authentication mechanisms
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next middleware function
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get wallet address from header
    const walletAddress = req.headers["x-wallet-address"] as string;
    
    if (!walletAddress) {
      // For development purposes, use a default test wallet if none provided
      // This allows testing of authenticated routes without a real wallet connection
      if (process.env.NODE_ENV !== "production") {
        // Use the demo DRep user from storage
        const demoUser = await storage.getUser(1); // ID 1 is our demo DRep
        
        if (demoUser) {
          req.user = {
            id: demoUser.id,
            walletAddress: demoUser.walletAddress || '',
            stakeAddress: demoUser.stakeAddress || '',
            isDRep: demoUser.isDRep,
            votingPower: demoUser.votingPower
          };
          return next();
        }
      }
      
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Find user by wallet address
    const user = await storage.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      // If no user exists with this wallet address, create one
      // In a real application, we would verify the wallet signature
      // before creating a new user account
      
      // For now, just return unauthorized
      return res.status(401).json({ message: "Wallet not registered" });
    }
    
    // Attach user to request object
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress || '',
      stakeAddress: user.stakeAddress || '',
      isDRep: user.isDRep,
      votingPower: user.votingPower
    };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}
