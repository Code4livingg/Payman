const WDKPkg = require("@tetherto/wdk");
const WDK = WDKPkg.default || WDKPkg;
const WalletManagerEvm = require("@tetherto/wdk-wallet-evm").default || require("@tetherto/wdk-wallet-evm");

const seed = process.env.WDK_SEED_PHRASE;

if (!seed) {
  throw new Error("WDK_SEED_PHRASE is missing");
}

async function main() {
  const wdk = new WDK(seed).registerWallet("ethereum", WalletManagerEvm, {
    provider: process.env.ETHEREUM_RPC_URL || "https://rpc.sepolia.org",
  });

  const account = await wdk.getAccount("ethereum", 0);
  const address = await account.getAddress();
  console.log(address);
}

main().catch(console.error);
