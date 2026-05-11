import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';
import SmartAccountFactoryABI from './contracts/SmartAccountFactory.json';
import SmartAccountABI from './contracts/SmartAccount.json';
import sepoliaDeployment from './contracts/sepolia.json';

// ─── Addresses ────────────────────────────────────────────────────────────────
const FACTORY_ADDRESS   = sepoliaDeployment.SmartAccountFactory.address;
const STK_ADDRESS       = '0x036150039c33b1645080a9c913f96D4c65ccca48';

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const FACTORY_ABI       = SmartAccountFactoryABI.abi;

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
];


// ─── Colors ───────────────────────────────────────────────────────────────────
const DARK   = '#2d1f0e';
const MUTED  = '#9a7c60';
const ORANGE = '#ff8c42';
const PURPLE = '#7c3aed';
const GREEN  = '#16a34a';

function Spinner() {
  return <span className="spinner" />;
}


const parseError = (err) => {
  if (err.message?.includes('user rejected'))      return 'Transaction rejected in MetaMask.';
  if (err.message?.includes('insufficient funds')) return 'Insufficient funds.';
  if (err.message?.includes('AA21'))               return 'Paymaster deposit too low.';
  if (err.message?.includes('AA24'))               return 'Signature validation failed.';
  if (err.message?.includes('AA31'))               return 'Paymaster deposit too low.';
  return err.message || 'Transaction failed. Please try again.';
};

export default function App() {
  const [account,             setAccount]             = useState(null);
  const [provider,            setProvider]            = useState(null);
  const [signer,              setSigner]              = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [isDeployed,          setIsDeployed]          = useState(false);
  const [stkBalance,          setStkBalance]          = useState('0');
  const [destAddress,         setDestAddress]         = useState('');
  const [sendAmount,          setSendAmount]          = useState('');
  const [status,              setStatus]              = useState('');
  const [statusType,          setStatusType]          = useState('default');
  const [isLoading,           setIsLoading]           = useState(false);
  const [txHash,              setTxHash]              = useState('');

  const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });

  const loadSmartAccountData = useCallback(async (_provider, _account) => {
    try {
      const rpc = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_ALCHEMY_URL,
        { name: 'sepolia', chainId: 11155111 }
      );
      const factory   = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, rpc);
      const predicted = await factory.getAddress(_account, 0);
      setSmartAccountAddress(predicted);
      const code      = await rpc.getCode(predicted);
      setIsDeployed(code !== '0x');
      const stk = new ethers.Contract(STK_ADDRESS, ERC20_ABI, rpc);
      const bal = await stk.balanceOf(predicted);
      setStkBalance(ethers.utils.formatUnits(bal, 18));
    } catch (err) {
      console.error('Error loading smart account data:', err);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setStatus('MetaMask not found. Please install it.');
        setStatusType('error');
        return;
      }
      const _chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (_chainId !== '0xaa36a7') {
        setStatus('Please switch MetaMask to the Sepolia test network.');
        setStatusType('error');
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const _provider = new ethers.providers.Web3Provider(window.ethereum);
      const _signer   = _provider.getSigner();
      const _account  = await _signer.getAddress();
      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      await loadSmartAccountData(_provider, _account);
    } catch (err) {
      setStatus('Error connecting: ' + err.message);
      setStatusType('error');
    }
  }, [loadSmartAccountData]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handle = async (accounts) => {
      setStatus(''); setTxHash('');
      if (accounts.length === 0) {
        setAccount(null); setSigner(null); setProvider(null);
        setSmartAccountAddress(''); setStkBalance('0');
      } else {
        await connectWallet();
      }
    };
    window.ethereum.on('accountsChanged', handle);
    return () => window.ethereum.removeListener('accountsChanged', handle);
  }, [connectWallet]);

  const handleDeploy = async () => {
    try {
      setStatus('Deploying your Smart Account...');
      setStatusType('pending');
      setIsLoading(true);
      setTxHash('');
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.createAccount(account, 0);
      await tx.wait();
      setIsDeployed(true);
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Smart Account deployed!');
      setStatusType('success');
      await loadSmartAccountData(provider, account);
    } catch (err) {
      setIsLoading(false);
      setStatus(parseError(err));
      setStatusType('error');
    }
  };

  const handleGaslessSend = async () => {
    if (!ethers.utils.isAddress(destAddress)) {
      setStatus('Please enter a valid destination address.');
      setStatusType('error');
      return;
    }
    if (!sendAmount || Number(sendAmount) <= 0) {
      setStatus('Please enter an amount greater than zero.');
      setStatusType('error');
      return;
    }
    try {
      setStatus('Building UserOperation...');
      setStatusType('pending');
      setIsLoading(true);
      setTxHash('');

      const { createPublicClient, createWalletClient, http, custom, encodeFunctionData } = await import('viem');
      const { sepolia } = await import('viem/chains');
      const { createSmartAccountClient } = await import('permissionless');
      const { toSimpleSmartAccount } = await import('permissionless/accounts');
      const { createPimlicoClient } = await import('permissionless/clients/pimlico');
      const { entryPoint07Address } = await import('viem/account-abstraction');

      const pimlicoUrl = process.env.REACT_APP_PIMLICO_URL;
      const policyId  = process.env.REACT_APP_PIMLICO_POLICY_ID;

      // ── clients ──────────────────────────────────────────────────────────────
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.REACT_APP_ALCHEMY_URL),
      });

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Use ethers signer wrapped for viem compatibility
      const { toAccount } = await import('viem/accounts');

      const viemSigner = toAccount({
        address: account,
        async signMessage({ message }) {
          const msg = typeof message === 'string' ? message : message.raw;
          return signer.signMessage(ethers.utils.arrayify(msg));
        },
        async signTransaction() { throw new Error('Not supported'); },
        async signTypedData() { throw new Error('Not supported'); },
      });

      const pimlicoClient = createPimlicoClient({
        chain: sepolia,
        transport: http(pimlicoUrl),
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

      // ── smart account ─────────────────────────────────────────────────────────
      const smartAccount = await toSimpleSmartAccount({
        client: publicClient,
        owner: viemSigner,
        address: smartAccountAddress,
        entryPoint: {
          address: entryPoint07Address,
          version: '0.7',
        },
      });

      // ── smart account client with Pimlico sponsorship ─────────────────────────
      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain: sepolia,
        bundlerTransport: http(pimlicoUrl),
        paymaster: pimlicoClient,
        paymasterContext: {
          sponsorshipPolicyId: policyId,
        },
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast;
          },
        },
      });

      // ── encode STK transfer ───────────────────────────────────────────────────
      const transferCalldata = encodeFunctionData({
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to',     type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
        }],
        functionName: 'transfer',
        args: [destAddress, ethers.utils.parseUnits(sendAmount, 18).toBigInt()],
      });

      setStatus('Sign the transaction in MetaMask...');

      // ── send ──────────────────────────────────────────────────────────────────
      const txHashResult = await smartAccountClient.sendTransaction({
        to:    STK_ADDRESS,
        data:  transferCalldata,
        value: 0n,
      });

      setIsLoading(false);
      setTxHash(txHashResult);
      setStatus('Gasless transfer complete! Zero ETH spent.');
      setStatusType('success');
      setDestAddress('');
      setSendAmount('');
      await loadSmartAccountData(null, account);

    } catch (err) {
      console.log('Full error:', err);
      setIsLoading(false);
      setStatus(parseError(err));
      setStatusType('error');
    }
  };

  const handleRefresh = async () => {
    if (!provider || !account) return;
    await loadSmartAccountData(provider, account);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="shimmer-bg" />
      <div className="blob-extra" />
      <div className="content min-h-screen" style={{ padding: '40px 32px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative' }}>

          {/* TD LOGO */}
          <img src="/td-logo-justtd.png" alt="Tredway Development"
            style={{ position: 'absolute', top: 0, left: '-110px', height: '32px' }} />

          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>

              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: DARK, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Account Abstraction
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '15px', color: MUTED, fontWeight: 400 }}>
                Gasless transactions powered by ERC-4337
              </p>
            </div>
            {account && (
              <div style={{ textAlign: 'right' }}>
                <button onClick={handleRefresh} disabled={isLoading} className="btn-secondary" style={{ marginBottom: '8px' }}>
                  ↻ Refresh
                </button>
                <div style={{ fontSize: '11px', color: MUTED, marginBottom: '2px' }}>Connected</div>
                <div style={{ fontSize: '13px', fontFamily: 'DM Mono, monospace', color: DARK, fontWeight: 500 }}>
                  {account.slice(0,6)}...{account.slice(-4)}
                </div>
              </div>
            )}
          </div>

          {/* STATUS */}
          {status && (
            <div className={`status-bar status-${statusType}`}>
              {isLoading && <Spinner />}
              <span style={{ flex: 1 }}>{status}</span>
              {txHash && !isLoading && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: ORANGE, textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
                  View ↗
                </a>
              )}
            </div>
          )}

          {/* NOT CONNECTED */}
          {!account ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              {/* Decorative rings */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,140,66,0.15) 0%, rgba(192,132,252,0.15) 100%)',
                  border: '1.5px solid rgba(255,180,100,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '42px', margin: '0 auto',
                }}>⚡</div>
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 700, color: DARK, letterSpacing: '-0.01em' }}>
                Send tokens without paying gas
              </h2>
              <p style={{ margin: '0 0 32px', color: MUTED, fontSize: '15px' }}>
                Connect your wallet to see ERC-4337 in action
              </p>
              <button onClick={connectWallet} className="btn-connect">
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {/* STAT PILLS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'STK Balance',    value: fmt(stkBalance) + ' STK',                           accent: ORANGE },
                  { label: 'Smart Account',  value: smartAccountAddress ? smartAccountAddress.slice(0,6)+'...'+smartAccountAddress.slice(-4) : '—', accent: PURPLE },
                  { label: 'Status',         value: isDeployed ? '✓ Deployed' : 'Not Deployed',          accent: isDeployed ? GREEN : MUTED },
                ].map(stat => (
                  <div key={stat.label} className="stat-pill">
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: stat.accent }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* SMART ACCOUNT CARD */}
              <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: DARK }}>Your Smart Account</div>
                  {isDeployed && <span className="badge badge-green">✓ Deployed</span>}
                  {!isDeployed && <span className="badge" style={{ background: 'rgba(200,160,120,0.2)', color: '#92600a' }}>Not Deployed</span>}
                </div>
                <div style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '13px', color: PURPLE,
                  background: 'rgba(124,58,237,0.06)', borderRadius: '12px',
                  padding: '10px 14px', marginBottom: '14px', wordBreak: 'break-all',
                }}>
                  {smartAccountAddress}
                </div>
                {!isDeployed && (
                  <>
                    <p style={{ fontSize: '13px', color: MUTED, marginBottom: '16px', lineHeight: 1.6 }}>
                      Your Smart Account address is reserved but not yet on-chain. Deploy it once and it's yours forever.
                    </p>
                    <button onClick={handleDeploy} disabled={isLoading} className="btn-primary">
                      {isLoading ? <><Spinner /> Deploying...</> : 'Deploy Smart Account'}
                    </button>
                  </>
                )}
              </div>

              {/* GASLESS SEND CARD */}
              {isDeployed && (
                <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '4px' }}>
                      Send STK, No Gas Required
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>
                      Destination Address
                    </div>
                    <input
                      className="misty-input"
                      type="text"
                      placeholder="0x... recipient address"
                      value={destAddress}
                      onChange={e => setDestAddress(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: '6px', fontWeight: 600 }}>
                      Amount (STK)
                    </div>
                    <input
                      className="misty-input"
                      type="number"
                      placeholder="e.g. 10"
                      value={sendAmount}
                      onChange={e => setSendAmount(e.target.value)}
                    />
                  </div>

                  <button onClick={handleGaslessSend} disabled={isLoading} className="btn-primary" style={{ width: '100%', fontSize: '16px', padding: '16px' }}>
                    {isLoading ? <><Spinner /> Processing...</> : '⚡ Send Gasless'}
                  </button>

                </div>
              )}

              {/* NOT DEPLOYED HINT */}
              {!isDeployed && (
                <div style={{
                  background: 'rgba(255,255,255,0.4)', borderRadius: '16px',
                  padding: '16px 20px', border: '1px solid rgba(200,160,120,0.2)',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: MUTED }}>
                    Deploy your Smart Account above to enable gasless transfers.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}