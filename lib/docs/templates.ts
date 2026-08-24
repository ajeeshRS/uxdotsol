import { compositionMeta, type ComponentDocMeta } from "./types";

export const templateDocs: Record<string, ComponentDocMeta> = {
  "private-transfer": {
    anatomy: [
      "Private Pay shell",
      "ConnectWalletBtn navigation",
      "Recipient and USDC amount form",
      "Mint initialization guard",
      "Wallet signing and devnet confirmation",
    ],
    states: [
      "Idle",
      "Validating",
      "Checking accounts",
      "Setting up accounts",
      "Sending",
      "Confirmed",
      "Error",
    ],
    rationale:
      "Private payment demos should prove the full path, not stop at an unsigned payload. This template wires wallet connect, Private Payments API calls, wallet signing, transaction submission, and devnet confirmation into one tested page.",
    usage: `import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import PrivateTransfer from "@/components/uxdotsol/templates/private-transfer";
import { SolanaProvider } from "@/components/uxdotsol/components/solana-provider";

export default function App() {
  return (
    <SolanaProvider network={WalletAdapterNetwork.Devnet}>
      <PrivateTransfer />
    </SolanaProvider>
  );
}`,
    props: [],
  },
  "spl-token-transfer": compositionMeta(
    `import { SplTokenTransferTemplate } from "@/components/uxdotsol/templates/spl-token-transfer";

<SplTokenTransferTemplate defaultMint={mint} cluster="devnet" />`,
    [
      {
        name: "defaultMint",
        type: "string",
        defaultValue: "''",
        description: "Initial SPL token mint.",
      },
      {
        name: "cluster",
        type: "'mainnet-beta' | 'devnet' | 'testnet'",
        defaultValue: "'mainnet-beta'",
        description: "Network label and transaction-tracking cluster.",
      },
    ],
  ),
  "merchant-checkout": compositionMeta(
    `import { MerchantCheckoutTemplate } from "@/components/uxdotsol/templates/merchant-checkout";

<MerchantCheckoutTemplate
  recipient={merchantAddress}
  amount={0.25}
  reference={orderReference}
  merchantName="Example Store"
/>`,
    [
      {
        name: "props",
        type: "PaymentCheckoutFlowProps",
        defaultValue: "recipient and amount required",
        description: "Payment quote and Solana Pay checkout configuration.",
      },
      {
        name: "supportEmail",
        type: "string",
        defaultValue: "undefined",
        description: "Optional merchant support contact.",
      },
    ],
  ),
  "payment-tracking-receipt": compositionMeta(
    `import { PaymentTrackingReceiptTemplate } from "@/components/uxdotsol/templates/payment-tracking-receipt";

<PaymentTrackingReceiptTemplate signature={signature} cluster="mainnet-beta" />`,
    [
      {
        name: "signature",
        type: "string",
        defaultValue: "user input",
        description: "Optional controlled signature to track.",
      },
      {
        name: "cluster",
        type: "'mainnet-beta' | 'devnet' | 'testnet'",
        defaultValue: "'mainnet-beta'",
        description: "Cluster searched by the payment-status route.",
      },
    ],
  ),
  "mobile-wallet-payment": compositionMeta(
    `import { MobileWalletPaymentTemplate } from "@/components/uxdotsol/templates/mobile-wallet-payment";

<MobileWalletPaymentTemplate
  recipient={merchantAddress}
  amount={0.25}
  reference={orderReference}
/>`,
    [
      {
        name: "props",
        type: "MobileWalletPaymentFlowProps",
        defaultValue: "recipient and amount required",
        description: "Responsive Solana Pay request and wallet-handoff configuration.",
      },
      {
        name: "heading",
        type: "string",
        defaultValue: "'Pay with a mobile wallet'",
        description: "Page heading above the flow.",
      },
    ],
  ),
};
