import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WalletProvider } from "./contexts/WalletContext";
import { BudgetProvider } from "./contexts/BudgetContext";

createRoot(document.getElementById("root")!).render(
  <WalletProvider>
    <BudgetProvider>
      <App />
    </BudgetProvider>
  </WalletProvider>
);
