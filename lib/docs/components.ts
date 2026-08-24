import type { ComponentDocMeta } from "./types";

export const componentDocs: Record<string, ComponentDocMeta> = {
  "address-display": {
    anatomy: ["Address text", "Truncation formatting", "Copy trigger"],
    states: ["Default", "Hover", "Confirmation icon state"],
    rationale:
      "Addresses are long and hard to read. This compacts them while ensuring safe copying without missing characters.",
    usage: `import { AddressDisplay } from "@/components/uxdotsol/components/address-display";

export default function App() {
  return (
    <AddressDisplay address="UxSol1111111111111111111111111111111111111" truncate={true} />
  );
}`,
    props: [
      {
        name: "address",
        type: "string",
        defaultValue: "required",
        description: "The full on-chain address string to display (e.g. a base-58 public key).",
      },
      {
        name: "truncate",
        type: "boolean",
        defaultValue: "true",
        description: "When true, addresses longer than 10 characters are shortened to AAAA...ZZZZ format.",
      },
      {
        name: "copyable",
        type: "boolean",
        defaultValue: "true",
        description: "When true, clicking copies the full address to the clipboard and shows a confirmation icon.",
      },
    ],
  },
  "connect-wallet-btn": {
    anatomy: [
      "Wallet selection trigger",
      "Status indicator",
      "Dropdown menu",
      "Account info modal",
    ],
    states: [
      "Disconnected",
      "Connecting",
      "Connected (Address displayed)",
      "Error",
    ],
    rationale:
      "Solana wallet connection is the entry point for any dApp. This component provides a premium, battle-tested UI that handles multiple wallet adapters out of the box.",
    usage: [
      `import { SolanaProvider } from "@/components/uxdotsol/components/solana-provider";
import { ConnectWalletBtn } from "@/components/uxdotsol/components/connect-wallet-btn";

export default function App() {
  return (
    <SolanaProvider>
      <div className="flex justify-end p-4">
        <ConnectWalletBtn />
      </div>
    </SolanaProvider>
  );
} `,
      `MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=your_key
DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=your_key`,
    ],
    props: [
      {
        name: "menuOpen",
        type: "boolean",
        defaultValue: "false",
        description: "Current open/closed state of the mobile navigation menu. Drives the hamburger ↔ close icon.",
      },
      {
        name: "onMenuToggle",
        type: "(open: boolean) => void",
        defaultValue: "undefined",
        description: "Called when the mobile menu toggle is pressed. Receives the new boolean state.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the outermost flex wrapper.",
      },
      {
        name: "showMenuToggle",
        type: "boolean",
        defaultValue: "true",
        description: "Controls whether the mobile navigation toggle is rendered beside the wallet control.",
      },
    ],
  },
  "sign-in-with-solana": {
    anatomy: [
      "Solana identity badge",
      "Wallet and balance preview",
      "Primary authentication action",
      "Inline error feedback",
      "Session sign-out action",
    ],
    states: [
      "Checking session",
      "Ready",
      "Awaiting wallet approval",
      "Verifying",
      "Authenticated",
      "Error",
    ],
    rationale:
      "Wallet connection is not authentication. This component proves address ownership with the SIWS standard, binds the request to the application domain, verifies it on the server, and creates an HTTP-only session.",
    usage: [
      `import { ConnectWalletBtn } from "@/components/uxdotsol/components/connect-wallet-btn";
import { SignInWithSolana } from "@/components/uxdotsol/components/sign-in-with-solana";
import { SolanaProvider } from "@/components/uxdotsol/components/solana-provider";

export default function AccountPage() {
  return (
    <SolanaProvider>
      <ConnectWalletBtn />
      <SignInWithSolana
        onSuccess={(session) => {
          console.log("Authenticated wallet", session.address);
        }}
      />
    </SolanaProvider>
  );
}`,
      `SOLANA_AUTH_SECRET=generate_at_least_32_random_characters
SOLANA_AUTH_ORIGIN=https://example.com
SOLANA_AUTH_CHAIN_ID=mainnet
SOLANA_AUTH_STATEMENT=Sign in to Example`,
    ],
    props: [
      {
        name: "endpoint",
        type: "string",
        defaultValue: "'/api/auth/solana'",
        description: "Next.js route that creates challenges, verifies SIWS output, and manages the session cookie.",
      },
      {
        name: "accountEndpoint",
        type: "string",
        defaultValue: "'/api/wallet-account'",
        description: "Endpoint used to load the connected address's actual SOL balance.",
      },
      {
        name: "cluster",
        type: "'mainnet-beta' | 'devnet' | 'testnet'",
        defaultValue: "'mainnet-beta'",
        description: "Solana cluster used for the balance request and derived network label.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer authentication card.",
      },
      {
        name: "walletLabel",
        type: "string",
        defaultValue: "wallet adapter name",
        description: "Optional label override. By default the connected wallet adapter name is used.",
      },
      {
        name: "networkLabel",
        type: "string",
        defaultValue: "derived from cluster",
        description: "Optional network-label override. Pass an empty string to hide it.",
      },
      {
        name: "balance",
        type: "string",
        defaultValue: "fetched after connection",
        description: "Optional formatted balance override. Otherwise the connected address balance is fetched.",
      },
      {
        name: "fiatValue",
        type: "string",
        defaultValue: "undefined",
        description: "Optional formatted fiat equivalent displayed beside the balance.",
      },
      {
        name: "onSuccess",
        type: "(session: { address: string; expiresAt: string }) => void",
        defaultValue: "undefined",
        description: "Called after the server verifies the signature and creates a session.",
      },
      {
        name: "onError",
        type: "(error: Error) => void",
        defaultValue: "undefined",
        description: "Called when challenge creation, wallet approval, verification, or sign-out fails.",
      },
    ],
  },
  "solana-pay-checkout": {
    anatomy: [
      "Merchant identity and network",
      "Amount and order summary",
      "Solana Pay QR code",
      "Recipient verification details",
      "Verified payment status",
      "Wallet and copy actions",
    ],
    states: [
      "Ready for payment",
      "Awaiting confirmation",
      "Confirmed",
      "Expired",
      "Invalid request",
    ],
    rationale:
      "A checkout must make the amount, recipient, and current payment state easy to verify while supporting both cross-device QR scanning and same-device wallet deep links. Opening a wallet never implies payment success; the status remains controlled by merchant-side validation.",
    usage: `import { SolanaProvider } from "@/components/uxdotsol/components/solana-provider";
import { SolanaPayCheckout } from "@/components/uxdotsol/components/solana-pay-checkout";

export default function Checkout({ order }) {
  return (
    <SolanaProvider>
      <SolanaPayCheckout
        recipient={order.merchantAddress}
        amount={order.total}
        reference={order.paymentReference}
        merchantName="Acme Store"
        message={"Order " + order.id}
        memo={"ORDER:" + order.id}
        orderId={order.id}
        status={order.paymentStatus}
      />
    </SolanaProvider>
  );
}`,
    props: [
      {
        name: "recipient",
        type: "string",
        defaultValue: "required",
        description: "Merchant wallet address. For SPL payments, pass the wallet owner address rather than an associated token account.",
      },
      {
        name: "amount",
        type: "number",
        defaultValue: "required",
        description: "Positive payment amount in SOL or the selected token's display units.",
      },
      {
        name: "splToken",
        type: "string",
        defaultValue: "undefined",
        description: "Optional SPL token mint address. Omit it for native SOL payments.",
      },
      {
        name: "reference",
        type: "string | string[]",
        defaultValue: "undefined",
        description: "Unique reference address used to discover and reconcile this payment. A unique value per order is strongly recommended.",
      },
      {
        name: "merchantName",
        type: "string",
        defaultValue: "'Solana Pay'",
        description: "Merchant label encoded into the payment request and displayed in the card.",
      },
      {
        name: "description",
        type: "string",
        defaultValue: "'Secure wallet checkout'",
        description: "Short supporting text displayed below the merchant name.",
      },
      {
        name: "message",
        type: "string",
        defaultValue: "undefined",
        description: "Human-readable payment context encoded for the wallet to display.",
      },
      {
        name: "memo",
        type: "string",
        defaultValue: "undefined",
        description: "Public onchain memo. Never include private or sensitive information.",
      },
      {
        name: "orderId",
        type: "string",
        defaultValue: "undefined",
        description: "Optional order identifier shown in the checkout summary.",
      },
      {
        name: "tokenSymbol",
        type: "string",
        defaultValue: "'SOL' or 'Token'",
        description: "Display symbol for the requested asset.",
      },
      {
        name: "network",
        type: "'mainnet' | 'devnet' | 'testnet'",
        defaultValue: "'mainnet'",
        description: "Network label displayed for payment context. Solana Pay transfer URLs do not encode the cluster.",
      },
      {
        name: "status",
        type: "'ready' | 'processing' | 'confirmed' | 'expired'",
        defaultValue: "'ready'",
        description: "Externally controlled payment state. Set confirmed only after merchant-side onchain validation.",
      },
      {
        name: "walletLaunchUrl",
        type: "string",
        defaultValue: "generated Solana Pay URL",
        description: "Optional wallet-specific universal or deep link used by the launch button. By default the button explicitly navigates to the generated solana: payment URI.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer checkout card.",
      },
      {
        name: "onOpenWallet",
        type: "(paymentUrl: string) => void",
        defaultValue: "undefined",
        description: "Called when the customer opens the Solana Pay wallet deep link.",
      },
      {
        name: "onCopy",
        type: "(paymentUrl: string) => void",
        defaultValue: "undefined",
        description: "Called after the payment URL is copied successfully.",
      },
      {
        name: "onTransactionSubmitted",
        type: "(signature: string) => void",
        defaultValue: "undefined",
        description: "Called after a connected browser wallet signs and submits the transfer. The payment must still be verified by the merchant.",
      },
      {
        name: "onPaymentError",
        type: "(error: Error) => void",
        defaultValue: "undefined",
        description: "Called when browser-wallet transaction construction or submission fails.",
      },
    ],
  },
  "transaction-review": {
    anatomy: [
      "Transaction and network context",
      "Debit and receive amounts",
      "Sender and recipient identities",
      "Safety warnings",
      "Fee and transaction details",
      "Risk acknowledgement and actions",
    ],
    states: [
      "Ready",
      "Warning",
      "Acknowledgement required",
      "Confirming",
      "Disabled",
    ],
    rationale:
      "Wallet prompts are often too late and too technical to be the only review surface. This component gives users a predictable, application-owned summary before signing while keeping data resolution, simulation, signing, and submission outside the UI layer.",
    usage: `"use client";

import { TransactionReview } from "@/components/uxdotsol/components/transaction-review";

export default function TransferReview() {
  return (
    <TransactionReview
      intent={{
        kind: "transfer",
        pay: {
          value: "1.25",
          symbol: "SOL",
          fiatValue: "≈ $182.40",
        },
        sender: {
          label: "Connected wallet",
          address: "4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw",
        },
        recipient: {
          label: "ux.sol",
          address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg88R",
          verified: true,
        },
        network: { cluster: "mainnet-beta" },
        fees: [{ label: "Network fee", value: "0.000005 SOL" }],
        walletDebit: { value: "1.250005", symbol: "SOL" },
      }}
      onCancel={() => history.back()}
      onConfirm={() => {
        // Continue to simulation or wallet signing.
      }}
    />
  );
}`,
    props: [
      {
        name: "intent",
        type: "TransactionReviewIntent",
        defaultValue: "required",
        description: "Normalized transaction kind, parties, amounts, network, fees, details, memo, and warnings displayed by the review.",
      },
      {
        name: "confirmLabel / cancelLabel",
        type: "string / string",
        defaultValue: "'Confirm transaction' / 'Cancel'",
        description: "Labels for the controlled review actions.",
      },
      {
        name: "isConfirming / disabled",
        type: "boolean / boolean",
        defaultValue: "false / false",
        description: "Controls the pending presentation and action availability without owning submission state.",
      },
      {
        name: "riskAcknowledged",
        type: "boolean",
        defaultValue: "uncontrolled",
        description: "Controlled acknowledgement state for warnings marked requiresAcknowledgement.",
      },
      {
        name: "defaultRiskAcknowledged",
        type: "boolean",
        defaultValue: "false",
        description: "Initial acknowledgement state when riskAcknowledged is not controlled.",
      },
      {
        name: "onRiskAcknowledgedChange",
        type: "(acknowledged: boolean) => void",
        defaultValue: "undefined",
        description: "Called when the user changes the risk acknowledgement checkbox.",
      },
      {
        name: "onConfirm / onCancel",
        type: "() => void / () => void",
        defaultValue: "undefined / undefined",
        description: "Controlled actions used by a parent flow to continue or leave the review step.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer review card.",
      },
    ],
    types: [
      {
        name: "TransactionReviewIntent",
        type: "object",
        defaultValue: "-",
        description: "Provider-neutral transaction review model; precise amounts are represented as strings.",
      },
      {
        name: "TransactionReviewWarning",
        type: "{ id; severity; title; description; requiresAcknowledgement? }",
        defaultValue: "-",
        description: "Informational, warning, or danger disclosure optionally requiring explicit acknowledgement.",
      },
    ],
  },
  "safe-recipient-field": {
    anatomy: [
      "Recipient label and address input",
      "Paste and clear actions",
      "Validation status indicator",
      "Explainable safety reasons",
      "On-chain account details",
    ],
    states: [
      "Idle",
      "Invalid",
      "Checking",
      "Safe",
      "Warning",
      "Blocked",
      "RPC error",
    ],
    rationale:
      "Recipient mistakes are difficult to reverse. This field validates address syntax immediately, detects self and application-blocked recipients, and inspects the current account through Solana RPC before a transaction proceeds. It never presents account existence as proof of human identity.",
    usage: `"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SafeRecipientField } from "@/components/uxdotsol/components/safe-recipient-field";

export function SendRecipient() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [canContinue, setCanContinue] = useState(false);

  return (
    <div>
      <SafeRecipientField
        value={recipient}
        onValueChange={setRecipient}
        connection={connection}
        sender={publicKey}
        onValidationChange={(result) => setCanContinue(result.canSubmit)}
      />
      <button disabled={!canContinue}>Continue to review</button>
    </div>
  );
}`,
    props: [
      {
        name: "value / defaultValue",
        type: "string / string",
        defaultValue: "uncontrolled / ''",
        description: "Controlled or initial recipient address value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        defaultValue: "undefined",
        description: "Called whenever typing, paste, or clear changes the address.",
      },
      {
        name: "connection / sender",
        type: "Connection | null / string | PublicKey | null",
        defaultValue: "undefined / undefined",
        description: "Real Solana RPC connection and optional sender used for account and self-recipient checks.",
      },
      {
        name: "allowSelf",
        type: "boolean",
        defaultValue: "false",
        description: "Downgrades a matching sender/recipient from blocked to warning when explicitly enabled.",
      },
      {
        name: "requireExistingAccount",
        type: "boolean",
        defaultValue: "false",
        description: "Blocks addresses without an existing account instead of showing the normal new-account warning.",
      },
      {
        name: "blockExecutableAccounts",
        type: "boolean",
        defaultValue: "true",
        description: "Blocks executable program accounts by default.",
      },
      {
        name: "blockedAddresses / trustedAddresses",
        type: "readonly string[] / readonly string[]",
        defaultValue: "[] / []",
        description: "Application policy lists applied before the RPC lookup.",
      },
      {
        name: "onValidationChange",
        type: "(validation: RecipientValidationValue) => void",
        defaultValue: "undefined",
        description: "Reports meaningful validation-state changes to the parent flow.",
      },
      {
        name: "label / description / placeholder",
        type: "string / string / string",
        defaultValue: "'Recipient' / safety guidance / 'Solana wallet address'",
        description: "Accessible field copy and placeholder customization.",
      },
      {
        name: "required / disabled / showDetails",
        type: "boolean / boolean / boolean",
        defaultValue: "false / false / true",
        description: "Native requirement, disabled state, and visibility of explainable RPC details.",
      },
    ],
  },
  "token-safety-disclosure": {
    anatomy: [
      "Token identity and provider verification",
      "Risk-level disclosure",
      "Explainable safety signals",
      "Liquidity and holder context",
      "Explorer link and limitations notice",
    ],
    states: [
      "Idle",
      "Loading",
      "No detected warnings",
      "Caution",
      "Danger",
      "Unknown token",
      "Provider error",
    ],
    rationale:
      "Token metadata is useful only when its uncertainty remains visible. This disclosure turns normalized provider signals into plain-language warnings, preserves honest missing-data and failure states, and never labels a token as guaranteed safe.",
    usage: `"use client";

import { TokenSafetyDisclosure } from "@/components/uxdotsol/components/token-safety-disclosure";

export function SwapTokenSafety({ mint }: { mint: string }) {
  return (
    <TokenSafetyDisclosure
      mint={mint}
      onSafetyChange={(result) => {
        if (result.risk === "danger") {
          // Require an explicit acknowledgement in the parent flow.
        }
      }}
    />
  );
}`,
    props: [
      {
        name: "mint",
        type: "string | null | undefined",
        defaultValue: "required",
        description: "Exact Solana token mint sent to the configured safety provider.",
      },
      {
        name: "adapter / assess",
        type: "TokenSafetyAdapter / TokenSafetyAssessor",
        defaultValue: "bundled HTTP adapter / assessTokenSafety",
        description: "Provider and policy boundaries inherited from the API abstraction hook.",
      },
      {
        name: "endpoint / enabled",
        type: "string / boolean",
        defaultValue: "'/api/token-safety' / true",
        description: "Same-origin endpoint override and request enablement.",
      },
      {
        name: "title / explorerBaseUrl",
        type: "string / string",
        defaultValue: "'Token safety' / Solscan token URL",
        description: "Accessible disclosure title and explorer destination prefix.",
      },
      {
        name: "showMetrics / showExplorerLink / compact",
        type: "boolean / boolean / boolean",
        defaultValue: "true / true / false",
        description: "Controls supporting metrics, explorer access, and condensed presentation.",
      },
      {
        name: "onSafetyChange",
        type: "(value: TokenSafetyValue) => void",
        defaultValue: "undefined",
        description: "Reports meaningful request and risk-state changes to a parent transaction flow.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer disclosure card.",
      },
    ],
  },
  "transaction-lifecycle": {
    anatomy: [
      "Current lifecycle status",
      "Wallet-to-confirmation steps",
      "RPC-backed status explanation",
      "Transaction signature and explorer access",
      "Safe retry and reset actions",
    ],
    states: [
      "Idle",
      "Awaiting wallet",
      "Submitting",
      "Pending",
      "Processed",
      "Confirmed",
      "Finalized",
      "Failed",
      "Expired",
    ],
    rationale:
      "Wallet approval, network submission, and chain confirmation are different events. This component keeps pre-signature states parent-controlled and switches to subscription-first RPC tracking only after a real signature exists. A timeout is explicitly not presented as proof of failure.",
    usage: `"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction } from "@solana/web3.js";
import { TransactionLifecycle } from "@/components/uxdotsol/components/transaction-lifecycle";

export function SelfTransferProgress() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "awaiting-wallet" | "failed"
  >("idle");
  const [error, setError] = useState<Error | null>(null);

  async function submit() {
    if (!publicKey) return;
    setSubmissionState("awaiting-wallet");
    setError(null);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 1,
        }),
      );
      setSignature(await sendTransaction(transaction, connection));
      setSubmissionState("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      setSubmissionState("failed");
    }
  }

  return (
    <TransactionLifecycle
      client={connection}
      signature={signature}
      submissionState={submissionState}
      submissionError={error}
      cluster="devnet"
      onRetry={() => void submit()}
    />
  );
}`,
    props: [
      {
        name: "signature / client",
        type: "string | null / TransactionStatusClient | null",
        defaultValue: "undefined / undefined",
        description: "Real transaction signature and Solana RPC client used after submission.",
      },
      {
        name: "submissionState / submissionError",
        type: "TransactionSubmissionState / Error | string | null",
        defaultValue: "'idle' / undefined",
        description: "Parent-controlled wallet and broadcast state before a signature exists.",
      },
      {
        name: "commitment / pollIntervalMs / timeoutMs / subscribe",
        type: "Commitment / number / number / boolean",
        defaultValue: "'confirmed' / 2000 / 90000 / true",
        description: "RPC tracking policy forwarded to useTransactionStatus.",
      },
      {
        name: "cluster / explorer / explorerUrl",
        type: "string",
        defaultValue: "'mainnet-beta' / 'solscan' / undefined",
        description: "Cluster and explorer link configuration.",
      },
      {
        name: "onRetry / onReset",
        type: "() => void / () => void",
        defaultValue: "undefined / undefined",
        description: "Retries pre-signature submission or resets the parent flow. Signature retries only recheck RPC status.",
      },
      {
        name: "onStatusChange",
        type: "(value: TransactionLifecycleValue) => void",
        defaultValue: "undefined",
        description: "Reports meaningful lifecycle transitions to parent orchestration or analytics.",
      },
      {
        name: "title / description / retryLabel / resetLabel",
        type: "string",
        defaultValue: "transaction guidance",
        description: "Customizable accessible labels and lifecycle guidance.",
      },
      {
        name: "showReset / className",
        type: "boolean / string",
        defaultValue: "true / ''",
        description: "Controls the terminal reset action and outer classes.",
      },
    ],
    types: [
      {
        name: "TransactionLifecycleState",
        type: "submission and RPC status union",
        defaultValue: "-",
        description: "Complete state vocabulary from wallet approval through finalization or failure.",
      },
      {
        name: "TransactionLifecycleValue",
        type: "TransactionStatusValue with lifecycle status",
        defaultValue: "-",
        description: "Normalized callback payload including signature, confirmation, error, and terminal flags.",
      },
    ],
  },
  "transaction-receipt": {
    anatomy: [
      "Authoritative result and network",
      "Transferred amount",
      "Sender and recipient",
      "Timestamp, slot, fee, and custom details",
      "Full signature copy and explorer actions",
    ],
    states: ["Empty", "Confirmed", "Finalized", "Failed"],
    rationale:
      "A receipt is durable transaction evidence, not a progress indicator. This provider-neutral component accepts normalized data only after a wallet, RPC, indexer, or backend establishes the result. It preserves the full signature and avoids inferring confirmation from UI state.",
    usage: `import {
  TransactionReceipt,
  type TransactionReceiptData,
} from "@/components/uxdotsol/components/transaction-receipt";

export function PaymentReceipt({
  receipt,
}: {
  receipt: TransactionReceiptData | null;
}) {
  return (
    <TransactionReceipt
      receipt={receipt}
      onDone={() => history.back()}
    />
  );
}`,
    props: [
      {
        name: "receipt",
        type: "TransactionReceiptData | null",
        defaultValue: "undefined",
        description: "Normalized authoritative transaction evidence. Null renders the honest empty state.",
      },
      {
        name: "title / emptyTitle / emptyDescription",
        type: "string",
        defaultValue: "receipt status copy",
        description: "Accessible confirmed, failed, and pre-receipt headings and guidance.",
      },
      {
        name: "explorer / explorerUrl",
        type: "'solscan' | 'explorer' | 'xray' / string",
        defaultValue: "'solscan' / undefined",
        description: "Explorer provider or custom transaction URL prefix.",
      },
      {
        name: "showExplorerLink / showCopySignature",
        type: "boolean / boolean",
        defaultValue: "true / true",
        description: "Controls signature verification actions without changing receipt evidence.",
      },
      {
        name: "doneLabel / onDone",
        type: "string / () => void",
        defaultValue: "'Done' / undefined",
        description: "Optional parent-flow completion action.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer receipt card.",
      },
    ],
    types: [
      {
        name: "TransactionReceiptData",
        type: "{ signature; status; network; amount?; fee?; sender?; recipient?; timestamp?; slot?; memo?; details? }",
        defaultValue: "-",
        description: "Provider-neutral immutable receipt model populated from an authoritative result.",
      },
      {
        name: "TransactionReceiptStatus",
        type: "'confirmed' | 'finalized' | 'failed'",
        defaultValue: "-",
        description: "Terminal transaction states supported by the receipt.",
      },
    ],
  },
  "transaction-progress-timeline": {
    anatomy: [
      "Accessible title and progress count",
      "Ordered milestone rail",
      "Observed UTC timestamps",
      "Optional provider detail",
      "Failure retry action",
    ],
    states: ["Empty", "Pending", "Active", "Complete", "Failed", "Skipped"],
    rationale:
      "A generic timeline preserves the history reported by any wallet, RPC, indexer, or backend without owning transaction tracking. Skipped milestones make gaps explicit when a provider first reports a later commitment, so the UI never fabricates events or timestamps.",
    usage: `import {
  TransactionProgressTimeline,
  type TransactionProgressStep,
} from "@/components/uxdotsol/components/transaction-progress-timeline";

export function PaymentProgress({
  steps,
}: {
  steps: readonly TransactionProgressStep[];
}) {
  return <TransactionProgressTimeline steps={steps} />;
}`,
    props: [
      {
        name: "steps",
        type: "readonly TransactionProgressStep[]",
        defaultValue: "[]",
        description: "Ordered provider-neutral milestones. An empty array renders the honest empty state.",
      },
      {
        name: "title / description / emptyTitle / emptyDescription",
        type: "string",
        defaultValue: "timeline guidance",
        description: "Accessible headings and guidance for populated and empty timelines.",
      },
      {
        name: "showTimestamps / compact",
        type: "boolean / boolean",
        defaultValue: "true / false",
        description: "Controls observed UTC timestamps and vertical spacing.",
      },
      {
        name: "retryLabel / onRetry",
        type: "string / () => void",
        defaultValue: "'Recheck transaction' / undefined",
        description: "Optional action shown only when at least one milestone has failed.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional classes applied to the outer timeline card.",
      },
    ],
    types: [
      {
        name: "TransactionProgressStep",
        type: "{ id; title; description?; detail?; timestamp?; status }",
        defaultValue: "-",
        description: "One normalized milestone and its observed evidence.",
      },
      {
        name: "TransactionProgressStepStatus",
        type: "'pending' | 'active' | 'complete' | 'failed' | 'skipped'",
        defaultValue: "-",
        description: "Provider-neutral milestone state vocabulary.",
      },
    ],
  },
  "fee-estimate": {
    anatomy: [
      "Estimate source and update state",
      "Estimated total",
      "Itemized fee lines",
      "Network and observed timestamp",
      "Change disclaimer and refresh action",
    ],
    states: [
      "Empty",
      "Loading",
      "Success",
      "Refreshing",
      "Error",
      "Stale result retained",
    ],
    rationale:
      "Fee calculation belongs to a wallet, RPC, indexer, or backend that has the exact transaction message. This controlled component presents normalized evidence without embedding a provider or treating an estimate as a guaranteed final charge.",
    usage: `import {
  FeeEstimate,
  type FeeEstimateData,
} from "@/components/uxdotsol/components/fee-estimate";

export function TransferFee({
  estimate,
}: {
  estimate: FeeEstimateData | null;
}) {
  return (
    <FeeEstimate
      estimate={estimate}
      onRefresh={() => calculateFeeForCurrentMessage()}
    />
  );
}`,
    props: [
      {
        name: "estimate",
        type: "FeeEstimateData | null",
        defaultValue: "undefined",
        description: "Normalized provider result with total, itemized fees, source, network, and observation time.",
      },
      {
        name: "status / error",
        type: "FeeEstimateStatus / Error | string | null",
        defaultValue: "inferred / undefined",
        description: "Controlled request state. A failed refresh can retain the previous estimate without presenting it as fresh.",
      },
      {
        name: "title / description / emptyTitle / emptyDescription",
        type: "string",
        defaultValue: "fee guidance",
        description: "Accessible headings and honest pre-calculation guidance.",
      },
      {
        name: "refreshLabel / onRefresh",
        type: "string / () => void",
        defaultValue: "'Refresh estimate' / undefined",
        description: "Optional provider refresh action, disabled while a real request is pending.",
      },
      {
        name: "disclaimer / className",
        type: "string / string",
        defaultValue: "change warning / ''",
        description: "Custom estimate caveat and outer classes.",
      },
    ],
    types: [
      {
        name: "FeeEstimateData",
        type: "{ total; items; network?; source?; updatedAt? }",
        defaultValue: "-",
        description: "Provider-neutral fee evidence for one transaction message.",
      },
      {
        name: "FeeEstimateLine",
        type: "{ id; label; amount; description? }",
        defaultValue: "-",
        description: "One network, priority, rent, service, or provider fee line.",
      },
      {
        name: "FeeEstimateStatus",
        type: "'idle' | 'loading' | 'success' | 'error'",
        defaultValue: "-",
        description: "Controlled provider request state.",
      },
    ],
  },
  button: {
    anatomy: ["Compact pill", "Zinc surface", "Subtle stroke", "Focus ring"],
    states: ["Default", "Hover", "Active", "Focus", "Disabled"],
    rationale:
      "Buttons use the same compact zinc design system as the wallet connect controls so actions feel consistent across nav, menus, and dialogs.",
    usage: `import { UxSolButton } from "@/components/uxdotsol/components/button";

export default function App() {
  return (
    <div className="flex gap-2">
      <UxSolButton>Connect Wallet</UxSolButton>
      <UxSolButton variant="secondary">Account</UxSolButton>
      <UxSolButton variant="ghost">Cancel</UxSolButton>
    </div>
  );
}`,
    props: [
      {
        name: "variant",
        type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success'",
        defaultValue: "'primary'",
        description: "Visual treatment for primary actions, soft surfaces, outlines, quiet actions, destructive actions, and success states.",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg' | 'icon'",
        defaultValue: "'md'",
        description: "Controls button height, hit target, horizontal padding, and text size.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "undefined",
        description: "Optional class names merged onto the button root.",
      },
    ],
  },
  "nft-card": {
    anatomy: ["Artwork Image", "Tilt Container", "Like Button", "Info Footer"],
    states: ["Default", "Hover (Tilt)", "Liked"],
    rationale:
      "Providing a premium, 3D interactive feel to digital assets drastically improves user engagement and perceived application value.",
    usage: `import { NFTCard } from "@/components/uxdotsol/components/nft-card";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <NFTCard
        image="https://www.madlads.com/_next/image?url=https%3A%2F%2Fmadlads.s3.us-west-2.amazonaws.com%2Fimages%2F1.png&w=1200&q=75"
        name="Madlads"
        collection="Madlads"
        verified={true}
        price="0.5"
        priceSymbol="SOL"
        lastSale="1.2"
        ownerName="Owner"
        likes={100}
        tilt={true}
      />
    </div>
  );
}`,
    props: [
      {
        name: "image",
        type: "string",
        defaultValue: "required",
        description: "URL of the NFT artwork image.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "required",
        description: "Display name / title of the NFT.",
      },
      {
        name: "collection",
        type: "string",
        defaultValue: "undefined",
        description: "Name of the collection this NFT belongs to.",
      },
      {
        name: "verified",
        type: "boolean",
        defaultValue: "false",
        description: "When true, renders a blue verified checkmark next to the collection name.",
      },
      {
        name: "price",
        type: "string",
        defaultValue: "undefined",
        description: "Listing price as a formatted string (e.g. \"1.5\"). Omit if not listed.",
      },
      {
        name: "priceSymbol",
        type: "string",
        defaultValue: "'SOL'",
        description: "Token symbol for the price (e.g. \"SOL\", \"ETH\").",
      },
      {
        name: "lastSale",
        type: "string",
        defaultValue: "undefined",
        description: "Label for the last sale price (e.g. \"1.2 SOL\").",
      },
      {
        name: "ownerAvatar",
        type: "string",
        defaultValue: "undefined",
        description: "URL of the owner / creator avatar image.",
      },
      {
        name: "ownerName",
        type: "string",
        defaultValue: "undefined",
        description: "Display name of the owner or creator.",
      },
      {
        name: "likes",
        type: "number",
        defaultValue: "undefined",
        description: "Initial like / favourite count displayed on the artwork overlay.",
      },
      {
        name: "href",
        type: "string",
        defaultValue: "undefined",
        description: "URL to the NFT on an external marketplace. Renders an icon button on the artwork.",
      },
      {
        name: "tilt",
        type: "boolean",
        defaultValue: "false",
        description: "Enables the interactive 3D mouse-tilt effect.",
      },
      {
        name: "tiltIntensity",
        type: "number",
        defaultValue: "28",
        description: "Tilt divisor — a higher value produces a subtler rotation.",
      },
      {
        name: "onBuy",
        type: "() => void",
        defaultValue: "undefined",
        description: "Callback fired when the Buy now action button is clicked.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the card root element.",
      },
    ],
  },
  "nft-card-collection": {
    anatomy: [
      "Collection Banner & Logo",
      "Interactive Flip Modal",
      "Scrollable NFT Grid",
      "Stats Footer",
    ],
    states: ["Default", "Hover (Tilt)", "Expanded (Flipped Modal)"],
    rationale:
      "Viewing an entire collection typically redirects the user. This component introduces an interactive flip modal to view items inline without destroying context.",
    usage: `import { NFTCollectionCard } from "@/components/uxdotsol/components/nft-card-collection";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <NFTCollectionCard
        bannerImage="https://example.com/banner.png"
        logoImage="https://example.com/logo.png"
        name="Mad Lads"
        verified={true}
        description="A collection of digital assets with shared artwork and metadata."
        itemCount={10000}
        tilt={true}
        items={[]}
      />
    </div>
  );
}`,
    props: [
      {
        name: "bannerImage",
        type: "string",
        defaultValue: "required",
        description: "Banner image URL displayed at the top of the card.",
      },
      {
        name: "logoImage",
        type: "string",
        defaultValue: "required",
        description: "Collection logo image URL.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "required",
        description: "Collection display name.",
      },
      {
        name: "verified",
        type: "boolean",
        defaultValue: "false",
        description: "Shows a blue verified checkmark next to the collection name.",
      },
      {
        name: "description",
        type: "string",
        defaultValue: "undefined",
        description: "Short description shown on the card and inside the modal.",
      },
      {
        name: "itemCount",
        type: "number",
        defaultValue: "undefined",
        description: "Total number of items in the collection.",
      },
      {
        name: "ownerCount",
        type: "number",
        defaultValue: "undefined",
        description: "Number of unique owners.",
      },
      {
        name: "floorPrice",
        type: "string",
        defaultValue: "undefined",
        description: "Current floor price as a formatted string (e.g. \"24.5\").",
      },
      {
        name: "priceSymbol",
        type: "string",
        defaultValue: "'SOL'",
        description: "Token symbol used for price display.",
      },
      {
        name: "volume24h",
        type: "string",
        defaultValue: "undefined",
        description: "24-hour trading volume as a formatted string.",
      },
      {
        name: "floorChange",
        type: "number",
        defaultValue: "undefined",
        description: "24-hour floor price change percentage. Positive = green badge, negative = red.",
      },
      {
        name: "href",
        type: "string",
        defaultValue: "undefined",
        description: "External marketplace URL. Renders a link button on the banner.",
      },
      {
        name: "tilt",
        type: "boolean",
        defaultValue: "false",
        description: "Enables the 3D mouse-tilt effect on the card.",
      },
      {
        name: "tiltIntensity",
        type: "number",
        defaultValue: "28",
        description: "Tilt divisor — a higher value produces a subtler rotation.",
      },
      {
        name: "onExplore",
        type: "() => void",
        defaultValue: "undefined",
        description: "Callback for the Explore collection button. Renders the button only when provided.",
      },
      {
        name: "items",
        type: "any[]",
        defaultValue: "undefined",
        description: "Array of NFT items shown in the grid inside the flip modal.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class applied to the card root element.",
      },
    ],
  },
  "coin-price": {
    anatomy: ["Token icon", "Price display", "24h change indicator", "Hover details"],
    states: ["Default", "Loading", "Error", "Expanded tooltip"],
    rationale:
      "The component is token-agnostic: pass a tokenName and optionally an API URL, and it renders the returned price payload without Solana-specific assumptions.",
    usage: [
      `import { CoinPrice } from "@/components/uxdotsol/components/coin-price";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <CoinPrice tokenName="solana" />
    </div>
  );
}`,
      `# .env.local
COINGECKO_API_KEY=your_server_side_key`,
    ],
    props: [
      {
        name: "tokenName",
        type: "string",
        defaultValue: "'solana'",
        description: "Optional token name/id passed to the API as tokenName. Examples: solana, bitcoin, ethereum.",
      },
      {
        name: "apiUrl",
        type: "string",
        defaultValue: "'/api/coin-price'",
        description: "Optional backend endpoint. Keep provider keys on the server; do not pass secret-bearing URLs to the client.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "undefined",
        description: "Optional class forwarded to the outer wrapper.",
      },
    ],
  },
  "token-swap": {
    anatomy: [
      "Pay and receive token selectors",
      "Amount and optional price context",
      "Slippage controls",
      "Fee state",
      "Execution action and error feedback",
    ],
    states: [
      "Integration required",
      "Ready",
      "Awaiting wallet",
      "Complete",
      "Error",
    ],
    rationale:
      "Swap UI must never fabricate execution. The component enables its action only when a real callback is supplied and reflects that callback's resolved or rejected state.",
    usage: `import TokenSwapCard from "@/components/uxdotsol/components/token-swap";

export default function App({ tokens, executeSwap }) {
  return (
    <div className="flex justify-center p-8">
      <TokenSwapCard
        tokens={tokens}
        networkFee="Calculated at signing"
        onSwap={async (from, to, amount) => {
          await executeSwap({ from, to, amount });
        }}
      />
    </div>
  );
}`,
    props: [
      {
        name: "tokens",
        type: "Token[]",
        defaultValue: "DEFAULT_TOKENS",
        description: "Token options displayed in the selectors. Default options intentionally omit dynamic balances and prices.",
      },
      {
        name: "defaultFrom",
        type: "Token",
        defaultValue: "tokens[0]",
        description: "Pre-selected pay-side token.",
      },
      {
        name: "defaultTo",
        type: "Token",
        defaultValue: "tokens[1]",
        description: "Pre-selected receive-side token.",
      },
      {
        name: "slippageOptions",
        type: "number[]",
        defaultValue: "[0.1, 0.5, 1.0]",
        description: "Available slippage tolerance options shown as pills (in percent).",
      },
      {
        name: "rateLabel",
        type: "string",
        defaultValue: "undefined",
        description: "Static exchange rate label used when USD prices are unavailable.",
      },
      {
        name: "networkFee",
        type: "string",
        defaultValue: "'Calculated at signing'",
        description: "Real calculated fee or honest fee state shown in the card footer.",
      },
      {
        name: "onSwap",
        type: "(from: Token, to: Token, amount: string) => void | Promise<void>",
        defaultValue: "undefined",
        description: "Real execution callback. Without it the component shows an integration-required state instead of simulating success.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "''",
        description: "Optional Tailwind / CSS class forwarded to the card root element.",
      },
    ],
  },
  "status-badge": {
    anatomy: ["Status dot", "Service label", "Live status text"],
    states: [
      "Loading",
      "Operational",
      "Degraded",
      "Partial outage",
      "Major outage",
      "Status unavailable",
    ],
    rationale:
      "Service health should be visible without overstating certainty. The Solana badge reads the official Statuspage API, distinguishes degraded and outage states, and exposes an honest unavailable state when health cannot be verified.",
    usage: `import { SolanaStatusBadge } from "@/components/uxdotsol/components/status-badge";

export default function App() {
  return (
    <div className="flex justify-center p-8">
      <SolanaStatusBadge />
    </div>
  );
}`,
    props: [
      {
        name: "size",
        type: "'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        description: "Badge size variant.",
      },
      {
        name: "onClick",
        type: "() => void",
        defaultValue: "undefined",
        description: "Optional click handler. Clicking the badge also triggers an immediate status refetch.",
      },
    ],
  },
};
