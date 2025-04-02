import { IStorage, storage } from '../storage';
import { 
  BudgetCategory, 
  BudgetItem, 
  BudgetPeriod,
  InsertBudgetCategory,
  InsertBudgetItem,
  InsertBudgetPeriod
} from '@shared/schema';

/**
 * Interface for imported spreadsheet data
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
 * Import budget data from a Google Sheet
 * 
 * @param sheetId Google Sheet ID
 * @param apiKey Optional Google API key
 * @returns Imported budget data
 */
export async function importFromGoogleSheet(
  sheetId: string,
  apiKey?: string
): Promise<{ success: boolean; message: string; data?: ImportedBudgetData }> {
  try {
    // Base URL for the Google Sheets API
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    // Construct the API URL - first we'll get the sheet metadata to find all the tabs
    let url = `${baseUrl}/${sheetId}?key=${apiKey}`;
    if (!apiKey) {
      return { 
        success: false, 
        message: 'Google API key is required for accessing the spreadsheet' 
      };
    }
    
    // Fetch the metadata first to get sheet names
    const metadataResponse = await fetch(url);
    if (!metadataResponse.ok) {
      throw new Error(`HTTP error ${metadataResponse.status}: ${await metadataResponse.text()}`);
    }
    
    const metadata = await metadataResponse.json();
    const sheets = metadata.sheets;
    
    if (!sheets || !Array.isArray(sheets)) {
      return { 
        success: false, 
        message: 'No sheets found in the spreadsheet' 
      };
    }
    
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
    
    // Process each sheet
    for (const sheet of sheets) {
      const sheetTitle = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      
      // Fetch the actual data from this sheet
      const dataUrl = `${baseUrl}/${sheetId}/values/${encodeURIComponent(sheetTitle)}?key=${apiKey}`;
      const dataResponse = await fetch(dataUrl);
      
      if (!dataResponse.ok) {
        console.error(`Failed to fetch data for sheet ${sheetTitle}`);
        continue;
      }
      
      const sheetData = await dataResponse.json();
      const values = sheetData.values;
      
      if (!values || !Array.isArray(values) || values.length < 2) {
        console.error(`No valid data found in sheet ${sheetTitle}`);
        continue;
      }
      
      // Process sheets based on their title/purpose
      if (sheetTitle.toLowerCase() === 'budget_period' || sheetTitle.toLowerCase() === 'period') {
        processPeroidSheet(values, importedData);
      } else if (sheetTitle.toLowerCase() === 'categories') {
        processCategoriesSheet(values, importedData);
      } else if (sheetTitle.toLowerCase() === 'items' || sheetTitle.toLowerCase() === 'budget_items') {
        processItemsSheet(values, importedData);
      } else {
        // It might be a category-specific sheet
        const matchingCategory = importedData.categories.find(
          cat => cat.name.toLowerCase() === sheetTitle.toLowerCase()
        );
        
        if (matchingCategory) {
          processCategoryItemsSheet(values, importedData, matchingCategory.name);
        } else {
          console.log(`Skipping unknown sheet: ${sheetTitle}`);
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Data imported successfully', 
      data: importedData 
    };
  } catch (error) {
    console.error('Error importing from Google Sheet:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error importing sheet data' 
    };
  }
}

/**
 * Process the budget period sheet
 */
function processPeroidSheet(values: any[][], importedData: ImportedBudgetData): void {
  // Find header row and data row
  const headerRow = values[0];
  const dataRow = values[1]; // Assuming period data is in the second row
  
  // Extract data based on column headers
  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i].toLowerCase();
    const value = dataRow[i];
    
    if (header === 'title') {
      importedData.period.title = value;
    } else if (header === 'description') {
      importedData.period.description = value;
    } else if (header === 'totalbudget' || header === 'total_budget' || header === 'budget') {
      importedData.period.totalBudget = parseFloat(value) * 1000000; // Convert to lovelace
    } else if (header === 'startdate' || header === 'start_date') {
      importedData.period.startDate = parseDate(value);
    } else if (header === 'enddate' || header === 'end_date') {
      importedData.period.endDate = parseDate(value);
    } else if (header === 'governanceaction' || header === 'governance_action') {
      importedData.period.governanceAction = value;
    }
  }
}

/**
 * Process the categories sheet
 */
function processCategoriesSheet(values: any[][], importedData: ImportedBudgetData): void {
  // Find the header row
  const headerRow = values[0].map((header: string) => header.toLowerCase());
  
  // Extract column indices
  const nameIndex = headerRow.indexOf('name');
  const descriptionIndex = headerRow.indexOf('description');
  const colorIndex = headerRow.indexOf('color');
  
  if (nameIndex === -1) {
    console.error('Categories sheet is missing the name column');
    return;
  }
  
  // Process each data row
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[nameIndex]) continue; // Skip empty rows
    
    const category = {
      name: row[nameIndex],
      description: descriptionIndex !== -1 ? row[descriptionIndex] || '' : '',
      color: colorIndex !== -1 ? row[colorIndex] || '#4C6FFF' : '#4C6FFF' // Default to cardano-blue
    };
    
    importedData.categories.push(category);
  }
}

/**
 * Process the items sheet
 */
function processItemsSheet(values: any[][], importedData: ImportedBudgetData, categoryName?: string): void {
  // Find the header row
  const headerRow = values[0].map((header: string) => header.toLowerCase());
  
  // Extract column indices
  const titleIndex = headerRow.indexOf('title');
  const descriptionIndex = headerRow.indexOf('description');
  const categoryIndex = headerRow.indexOf('category');
  const amountIndex = headerRow.indexOf('amount') !== -1 ? 
    headerRow.indexOf('amount') : 
    headerRow.indexOf('suggestedamount') !== -1 ?
    headerRow.indexOf('suggestedamount') :
    headerRow.indexOf('suggested_amount');
  
  if (titleIndex === -1 || amountIndex === -1) {
    console.error('Items sheet is missing required columns');
    return;
  }
  
  // Process each data row
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[titleIndex]) continue; // Skip empty rows
    
    const budgetItem = {
      title: row[titleIndex],
      description: descriptionIndex !== -1 ? row[descriptionIndex] || '' : '',
      categoryName: categoryName || (categoryIndex !== -1 ? row[categoryIndex] : 'Uncategorized'),
      suggestedAmount: amountIndex !== -1 ? parseFloat(row[amountIndex]) * 1000000 : 0 // Convert to lovelace
    };
    
    importedData.items.push(budgetItem);
  }
}

/**
 * Process a category-specific items sheet
 */
function processCategoryItemsSheet(values: any[][], importedData: ImportedBudgetData, categoryName: string): void {
  processItemsSheet(values, importedData, categoryName);
}

/**
 * Helper to parse dates from various formats
 */
function parseDate(dateString: string): Date {
  // Try to parse the date from various formats
  let date = new Date(dateString);
  
  // If the date is invalid, try some other common formats
  if (isNaN(date.getTime())) {
    // Try DD/MM/YYYY format
    const parts = dateString.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Assume DD/MM/YYYY or MM/DD/YYYY
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      
      // If still invalid, try MM/DD/YYYY
      if (isNaN(date.getTime())) {
        date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      }
    }
  }
  
  // If all parsing attempts fail, use current date
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
}

/**
 * Save imported budget data to storage
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
            color: '#4C6FFF' // Default color
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