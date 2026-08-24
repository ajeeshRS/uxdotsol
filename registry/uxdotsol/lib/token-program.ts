import { Buffer } from "buffer";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

export function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
  tokenProgramId = TOKEN_PROGRAM_ID,
) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgramId.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export async function getMintDecimals(
  connection: Connection,
  mint: PublicKey,
  tokenProgramId: PublicKey,
) {
  const account = await connection.getAccountInfo(mint, "confirmed");
  if (!account || !account.owner.equals(tokenProgramId) || account.data.length < 45) {
    throw new Error("The selected address is not an SPL token mint.");
  }
  return account.data[44];
}

export function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedAccount: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgramId = TOKEN_PROGRAM_ID,
) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedAccount, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ],
  });
}

export function createTransferCheckedInstruction(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number,
  tokenProgramId = TOKEN_PROGRAM_ID,
) {
  if (amount < 0n || amount > 0xffffffffffffffffn) {
    throw new Error("Token amount exceeds the unsigned 64-bit transfer limit.");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error("Token mint decimals are invalid.");
  }

  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0);
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);

  return new TransactionInstruction({
    programId: tokenProgramId,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}
