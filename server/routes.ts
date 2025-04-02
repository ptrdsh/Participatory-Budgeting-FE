import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { authMiddleware } from "./middleware/auth";
import { 
  getBudgetItems, 
  getBudgetCategories, 
  getActiveBudgetPeriod 
} from "./services/budgetService";
import { 
  calculateStatistics, 
  getCategoryDistribution 
} from "./services/statisticsService";
import {
  submitVote,
  submitBulkVotes,
  getUserVotes
} from "./services/votingService";
import {
  checkDRepStatus
} from "./services/cardanoService";
import {
  importFromGoogleSheet,
  saveImportedBudgetData
} from "./services/importService";
import {
  getBudgetItemSentiments,
  getUserSentiment,
  submitSentiment
} from "./services/sentimentService";
import { z } from "zod";
import { insertBudgetVoteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // ------------- Budget Related Routes -------------

  // Get all budget items
  app.get(`${apiPrefix}/budget/items`, async (req: Request, res: Response) => {
    try {
      const items = await getBudgetItems(storage);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  // Get all budget categories
  app.get(`${apiPrefix}/budget/categories`, async (req: Request, res: Response) => {
    try {
      const categories = await getBudgetCategories(storage);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  // Get active budget period
  app.get(`${apiPrefix}/budget/period/active`, async (req: Request, res: Response) => {
    try {
      const activePeriod = await getActiveBudgetPeriod(storage);
      if (!activePeriod) {
        return res.status(404).json({ message: "No active budget period found" });
      }
      res.json(activePeriod);
    } catch (error) {
      console.error("Error fetching active budget period:", error);
      res.status(500).json({ message: "Failed to fetch active budget period" });
    }
  });

  // Get budget statistics
  app.get(`${apiPrefix}/budget/statistics`, async (req: Request, res: Response) => {
    try {
      const statistics = await calculateStatistics(storage);
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching budget statistics:", error);
      res.status(500).json({ message: "Failed to fetch budget statistics" });
    }
  });

  // ------------- Vote Related Routes -------------

  // Get user votes (requires auth)
  app.get(`${apiPrefix}/votes/user`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const votes = await getUserVotes(storage, req.user.id);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      res.status(500).json({ message: "Failed to fetch user votes" });
    }
  });

  // Submit a vote (requires auth)
  app.post(`${apiPrefix}/votes/submit`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const voteSchema = insertBudgetVoteSchema.extend({
        budgetItemId: z.number(),
        amount: z.number().min(0),
      });
      
      const validationResult = voteSchema.safeParse({
        userId: req.user.id,
        budgetItemId: req.body.budgetItemId,
        amount: req.body.amount,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid vote data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { txHash } = await submitVote(
        storage, 
        validationResult.data.userId, 
        validationResult.data.budgetItemId, 
        validationResult.data.amount
      );
      
      res.json({ txHash });
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Submit bulk votes (requires auth)
  app.post(`${apiPrefix}/votes/submit-bulk`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const votesSchema = z.array(
        z.object({
          budgetItemId: z.number(),
          amount: z.number().min(0),
        })
      );
      
      const validationResult = votesSchema.safeParse(req.body.votes);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid votes data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { txHash } = await submitBulkVotes(
        storage, 
        req.user.id, 
        validationResult.data
      );
      
      res.json({ txHash });
    } catch (error) {
      console.error("Error submitting bulk votes:", error);
      res.status(500).json({ message: "Failed to submit bulk votes" });
    }
  });

  // ------------- Import Related Routes -------------

  // Import budget data from Google Sheets
  app.post(`${apiPrefix}/budget/import/google-sheet`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.isDRep) {
        return res.status(403).json({ message: "Only DReps can import budget data" });
      }
      
      const { sheetId, apiKey } = req.body;
      
      if (!sheetId) {
        return res.status(400).json({ message: "Google Sheet ID is required" });
      }
      
      // First import the data from Google Sheets
      const importResult = await importFromGoogleSheet(sheetId, apiKey);
      
      if (!importResult.success || !importResult.data) {
        return res.status(400).json({ message: importResult.message });
      }
      
      // Then save the imported data to the database
      const saveResult = await saveImportedBudgetData(storage, importResult.data);
      
      res.json(saveResult);
    } catch (error) {
      console.error("Error importing budget data:", error);
      res.status(500).json({ message: "Failed to import budget data" });
    }
  });

  // ------------- CSV Data Routes -------------
  
  // Serve CSV files from data directory
  app.use('/data', express.static('data'));
  
  // ------------- Sentiment Related Routes -------------
  
  // Get budget item sentiments
  app.get(`${apiPrefix}/sentiments/item/:budgetItemId`, async (req: Request, res: Response) => {
    try {
      const budgetItemId = parseInt(req.params.budgetItemId);
      
      if (isNaN(budgetItemId)) {
        return res.status(400).json({ message: "Invalid budget item ID" });
      }
      
      const sentiments = await getBudgetItemSentiments(storage, budgetItemId);
      res.json(sentiments);
    } catch (error) {
      console.error("Error fetching budget item sentiments:", error);
      res.status(500).json({ message: "Failed to fetch budget item sentiments" });
    }
  });
  
  // Get user sentiment for a budget item
  app.get(`${apiPrefix}/sentiments/user/:budgetItemId`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const budgetItemId = parseInt(req.params.budgetItemId);
      
      if (isNaN(budgetItemId)) {
        return res.status(400).json({ message: "Invalid budget item ID" });
      }
      
      const sentiment = await getUserSentiment(storage, req.user.id, budgetItemId);
      res.json(sentiment || null);
    } catch (error) {
      console.error("Error fetching user sentiment:", error);
      res.status(500).json({ message: "Failed to fetch user sentiment" });
    }
  });
  
  // Submit a sentiment reaction
  app.post(`${apiPrefix}/sentiments/submit`, authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { budgetItemId, sentiment } = req.body;
      
      if (!budgetItemId || !sentiment) {
        return res.status(400).json({ message: "Budget item ID and sentiment are required" });
      }
      
      const result = await submitSentiment(storage, req.user.id, budgetItemId, sentiment);
      res.json(result);
    } catch (error) {
      console.error("Error submitting sentiment:", error);
      res.status(500).json({ message: "Failed to submit sentiment" });
    }
  });
  
  // ------------- DRep Related Routes -------------
  
  // Check DRep status
  app.get(`${apiPrefix}/drep/status`, async (req: Request, res: Response) => {
    try {
      const stakeAddress = req.query.stakeAddress as string;
      
      if (!stakeAddress) {
        return res.status(400).json({ message: "Stake address is required" });
      }
      
      const drepStatus = await checkDRepStatus(storage, stakeAddress);
      res.json(drepStatus);
    } catch (error) {
      console.error("Error checking DRep status:", error);
      res.status(500).json({ message: "Failed to check DRep status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Add user object to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        walletAddress: string;
        stakeAddress: string;
        isDRep: boolean;
        votingPower: number;
      };
    }
  }
}
