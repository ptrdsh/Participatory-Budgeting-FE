import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { IStorage } from '../storage';
import { 
  InsertBudgetPeriod, 
  InsertBudgetCategory, 
  InsertBudgetItem 
} from '@shared/schema';

/**
 * Interface for imported CSV data
 */
interface ImportedBudgetData {
  period: {
    title: string;
    description: string;
    totalBudget: number;
    startDate: Date;
    endDate: Date;
    governanceAction: string;
  };
  categories: Array<{
    name: string;
    description: string;
    color: string;
  }>;
  items: Array<{
    title: string;
    description: string;
    categoryName: string; // We'll need to map this to the categoryId
    suggestedAmount: number;
  }>;
}

/**
 * Parse CSV files in the data/budget directory
 * @returns Imported budget data
 */
export async function importFromCSVFiles(): Promise<{ success: boolean; message: string; data?: ImportedBudgetData }> {
  try {
    // Initialize the imported data structure
    const importedData: ImportedBudgetData = {
      period: {
        title: '',
        description: '',
        totalBudget: 0,
        startDate: new Date(),
        endDate: new Date(),
        governanceAction: ''
      },
      categories: [],
      items: []
    };

    // Parse period.csv
    const periodData = await parseCSVFile(path.join(process.cwd(), 'data', 'budget', 'period.csv'));
    if (periodData.length > 0) {
      const period = periodData[0];
      importedData.period = {
        title: period.title || '',
        description: period.description || '',
        totalBudget: parseFloat(period.totalBudget || '0'),
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate),
        governanceAction: period.governanceAction || ''
      };
    } else {
      return { 
        success: false, 
        message: 'No budget period data found in period.csv' 
      };
    }

    // Parse categories.csv
    const categoriesData = await parseCSVFile(path.join(process.cwd(), 'data', 'budget', 'categories.csv'));
    if (categoriesData.length > 0) {
      importedData.categories = categoriesData.map(category => ({
        name: category.name || '',
        description: category.description || '',
        color: category.color || 'blue'
      }));
    } else {
      return { 
        success: false, 
        message: 'No categories data found in categories.csv' 
      };
    }

    // Parse items.csv
    const itemsData = await parseCSVFile(path.join(process.cwd(), 'data', 'budget', 'items.csv'));
    if (itemsData.length > 0) {
      importedData.items = itemsData.map(item => ({
        title: item.title || '',
        description: item.description || '',
        categoryName: item.categoryName || 'Uncategorized',
        suggestedAmount: parseFloat(item.suggestedAmount || '0')
      }));
    } else {
      return { 
        success: false, 
        message: 'No budget items data found in items.csv' 
      };
    }

    return { 
      success: true, 
      message: 'Data imported successfully from CSV files', 
      data: importedData 
    };
  } catch (error) {
    console.error('Error importing from CSV files:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error importing CSV data' 
    };
  }
}

/**
 * Parse a CSV file into an array of objects
 * @param filePath Path to the CSV file
 * @returns Array of objects representing the CSV data
 */
async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    // Create a readable stream from the CSV file
    const fileStream = fs.createReadStream(filePath);
    
    // Create a parser with header option to automatically create objects
    const parser = parse({
      columns: true, // Treat the first line as header
      skip_empty_lines: true,
      trim: true
    });
    
    // Handle parsing events
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        results.push(record);
      }
    });
    
    // Handle parsing errors
    parser.on('error', (err) => {
      reject(err);
    });
    
    // When parsing is complete
    parser.on('end', () => {
      resolve(results);
    });
    
    // Pipe the file to the parser
    fileStream.pipe(parser);
  });
}

/**
 * Save imported budget data to storage
 * Uses the same function from importService.ts
 * 
 * @param storage Storage interface
 * @param data Imported budget data
 * @returns Object with new budget period ID and counts of imported items
 */
export async function saveImportedBudgetData(
  storage: IStorage,
  data: ImportedBudgetData
): Promise<{ 
  success: boolean;
  message: string;
  periodId?: number;
  categoriesCount?: number;
  itemsCount?: number;
}> {
  try {
    // 1. Create budget period
    const periodData: InsertBudgetPeriod = {
      title: data.period.title,
      description: data.period.description,
      totalBudget: data.period.totalBudget,
      startDate: data.period.startDate,
      endDate: data.period.endDate,
      governanceAction: data.period.governanceAction,
      active: true
    };
    
    // Deactivate any currently active periods
    const currentActivePeriod = await storage.getActiveBudgetPeriod();
    if (currentActivePeriod) {
      await storage.updateBudgetPeriodStatus(currentActivePeriod.id, false);
    }
    
    // Create the new period
    const newPeriod = await storage.createBudgetPeriod(periodData);
    
    // 2. Create categories and build a mapping
    const categoryMap = new Map<string, number>();
    
    for (const cat of data.categories) {
      const categoryData: InsertBudgetCategory = {
        name: cat.name,
        description: cat.description,
        color: cat.color
      };
      
      const newCategory = await storage.createBudgetCategory(categoryData);
      categoryMap.set(cat.name, newCategory.id);
    }
    
    // 3. Create budget items
    let itemsImported = 0;
    
    for (const item of data.items) {
      // Get the category ID
      let categoryId = 0;
      
      if (categoryMap.has(item.categoryName)) {
        categoryId = categoryMap.get(item.categoryName)!;
      } else {
        // Try case-insensitive match
        const casedName = Array.from(categoryMap.keys()).find(
          key => key.toLowerCase() === item.categoryName.toLowerCase()
        );
        
        if (casedName) {
          categoryId = categoryMap.get(casedName)!;
        } else {
          // Create new category if it doesn't exist
          const categoryData: InsertBudgetCategory = {
            name: item.categoryName,
            description: '',
            color: 'blue' // Default color
          };
          
          const newCategory = await storage.createBudgetCategory(categoryData);
          categoryId = newCategory.id;
          categoryMap.set(item.categoryName, categoryId);
        }
      }
      
      // Create the budget item
      const itemData: InsertBudgetItem = {
        title: item.title,
        description: item.description,
        categoryId: categoryId,
        suggestedAmount: item.suggestedAmount
      };
      
      await storage.createBudgetItem(itemData);
      itemsImported++;
    }
    
    // 4. Initialize statistics for this period
    await storage.createStatistics({
      budgetPeriodId: newPeriod.id,
      totalDreps: 0,
      activeDreps: 0,
      totalAllocated: 0,
      percentageAllocated: 0,
      categoryDistribution: {}
    });
    
    return {
      success: true,
      message: `Import successful: created period with ${categoryMap.size} categories and ${itemsImported} budget items`,
      periodId: newPeriod.id,
      categoriesCount: categoryMap.size,
      itemsCount: itemsImported
    };
  } catch (error) {
    console.error('Error saving imported budget data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error saving imported data'
    };
  }
}