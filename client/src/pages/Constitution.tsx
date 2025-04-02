import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function Constitution() {
  const [constitution, setConstitution] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const constitutionUrl = "https://raw.githubusercontent.com/IntersectMBO/cardano-constitution/main/cardano-constitution-1/cardano-constitution-1.txt.md";

  useEffect(() => {
    const fetchConstitution = async () => {
      try {
        setLoading(true);
        const response = await fetch(constitutionUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        setConstitution(text);
      } catch (error) {
        console.error("Error fetching constitution:", error);
        setConstitution("Error loading the Cardano Constitution. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchConstitution();
  }, []);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([constitution], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = "cardano-constitution-1.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Book className="h-8 w-8 mr-2 text-cardano-blue" />
          <h1 className="text-3xl font-bold text-gray-900">Cardano Constitution</h1>
        </div>
        {!loading && (
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="prose prose-slate max-w-none p-4">
              <ReactMarkdown components={{
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-medium mt-4 mb-2" {...props} />,
                code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />
              }}>
                {constitution}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}