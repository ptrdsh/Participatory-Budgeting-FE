import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Import, KeyRound } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";

const formSchema = z.object({
  sheetId: z.string().min(1, {
    message: "Google Sheet ID is required",
  }),
  apiKey: z.string().min(1, {
    message: "Google API key is required for accessing the spreadsheet",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function GoogleSheetsImport() {
  const { toast } = useToast();
  const { isDRep } = useWallet();
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sheetId: "",
      apiKey: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsImporting(true);
      const result = await apiRequest("/api/budget/import/google-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId: values.sheetId,
          apiKey: values.apiKey,
        }),
      });

      if (result.success) {
        toast({
          title: "Import successful",
          description: result.message,
          variant: "default",
        });
        form.reset();
      } else {
        toast({
          title: "Import failed",
          description: result.message || "Failed to import budget data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }

  if (!isDRep) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Budget Data</CardTitle>
          <CardDescription>
            Only registered DReps can import budget data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="h-6 w-6 text-cardano-blue" />
          <CardTitle>Import From Google Sheets</CardTitle>
        </div>
        <CardDescription>
          Import budget categories and items from a Google Spreadsheet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="sheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Sheet ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter Google Sheet ID" 
                      {...field} 
                      disabled={isImporting}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the ID from the Google Sheet URL (e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter Google API Key"
                        className="pl-8"
                        type="password"
                        {...field}
                        disabled={isImporting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    A Google API key with access to the Google Sheets API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : (
                <div className="flex items-center gap-2">
                  <Import className="h-4 w-4" />
                  Import Budget Data
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          The spreadsheet should contain tabs for "budget_period", "categories", and "items" with appropriate columns.
          Alternatively, you can have category-specific tabs matching category names.
        </p>
      </CardFooter>
    </Card>
  );
}