import { useWallet } from "@/contexts/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, HeadingDescription, HeadingTitle } from "@/components/ui/heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import GoogleSheetsImport from "@/components/admin/GoogleSheetsImport";

export default function Admin() {
  const { connected, isDRep } = useWallet();

  if (!connected) {
    return (
      <div className="container mx-auto py-6">
        <Heading>
          <HeadingTitle>Administration</HeadingTitle>
          <HeadingDescription>
            Connect your wallet to access administration tools
          </HeadingDescription>
        </Heading>
        
        <Alert className="mt-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            Please connect your wallet to verify your access to administration functions
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isDRep) {
    return (
      <div className="container mx-auto py-6">
        <Heading>
          <HeadingTitle>Administration</HeadingTitle>
          <HeadingDescription>
            Only registered DReps can access administration tools
          </HeadingDescription>
        </Heading>
        
        <Alert className="mt-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            This page is only accessible to registered Delegation Representatives (DReps)
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Heading>
        <HeadingTitle>Administration</HeadingTitle>
        <HeadingDescription>
          Manage budget periods, categories, and items
        </HeadingDescription>
      </Heading>
      
      <Tabs defaultValue="import" className="mt-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="manage">Manage Periods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="mt-4">
          <GoogleSheetsImport />
        </TabsContent>
        
        <TabsContent value="manage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Budget Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This feature is coming soon. It will allow you to activate/deactivate budget periods.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}